import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Property, PropertyType } from '@/components/custom/BlockCanvas/types';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { queryKeys } from '@/lib/constants/queryKeys';

export interface UsePropertiesProps {
  documentId: string;
  blockId?: string;
}

export const useProperties = ({ documentId, blockId }: UsePropertiesProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const queryClient = useQueryClient();

  // Fetch properties for a document or specific block
  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('document_id', documentId)
        .eq('is_deleted', false)
        .order('position');

      // If blockId is provided, filter by block
      if (blockId) {
        query = query.eq('block_id', blockId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }

      // Update local state with the fetched properties
      const fetchedProperties = data as Property[];
      setProperties(fetchedProperties);
      
      // Invalidate related queries to ensure other components get the updated data
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.byDocument(documentId)
      });
      
      if (blockId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.properties.byBlock(blockId)
        });
      }

      return fetchedProperties;
    } catch (error) {
      console.error('Error in fetchProperties:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [documentId, blockId, queryClient]);

  // Create a new property
  const createProperty = useCallback(async (propertyData: Omit<Property, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...propertyData,
          key: propertyData.key || propertyData.name.toLowerCase().replace(/\s+/g, '_'),
        })
        .select();

      if (error) {
        console.error('Error creating property:', error);
        throw error;
      }

      // Update local state and invalidate queries
      const newProperty = data[0] as Property;
      setProperties(prev => [...prev, newProperty].sort((a, b) => a.position - b.position));
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.byDocument(documentId)
      });
      
      if (blockId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.properties.byBlock(blockId)
        });
      }

      return newProperty;
    } catch (error) {
      console.error('Error in createProperty:', error);
      throw error;
    }
  }, [documentId, blockId, queryClient]);

  // Update a property
  const updateProperty = useCallback(async (propertyId: string, updates: Partial<Property>) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', propertyId)
        .select();

      if (error) {
        console.error('Error updating property:', error);
        throw error;
      }

      // Update local state and invalidate queries
      const updatedProperty = data[0] as Property;
      setProperties(prev => 
        prev.map(p => p.id === propertyId ? updatedProperty : p)
          .sort((a, b) => a.position - b.position)
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.byDocument(documentId)
      });
      
      if (blockId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.properties.byBlock(blockId)
        });
      }

      return updatedProperty;
    } catch (error) {
      console.error('Error in updateProperty:', error);
      throw error;
    }
  }, [documentId, blockId, queryClient]);

  // Delete a property (soft delete)
  const deleteProperty = useCallback(async (propertyId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          is_deleted: true,
          deleted_by: userId,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', propertyId);

      if (error) {
        console.error('Error deleting property:', error);
        throw error;
      }

      // Update local state and invalidate queries
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.byDocument(documentId)
      });
      
      if (blockId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.properties.byBlock(blockId)
        });
      }

      return true;
    } catch (error) {
      console.error('Error in deleteProperty:', error);
      throw error;
    }
  }, [documentId, blockId, queryClient]);

  // Create default properties for a block
  const createDefaultProperties = useCallback(async (
    blockId: string, 
    orgId: string, 
    projectId: string, 
    userId: string
  ) => {
    try {
      // Define default properties (name, description, req_id)
      const defaultProperties: Omit<Property, 'id'>[] = [
        {
          org_id: orgId,
          project_id: projectId,
          document_id: documentId,
          block_id: blockId,
          name: 'Name',
          key: 'name',
          type: 'text' as PropertyType,
          description: 'Requirement name',
          position: 10,
          is_required: true,
          is_hidden: false,
          created_by: userId,
          updated_by: userId,
          is_deleted: false,
          is_schema: true,
        },
        {
          org_id: orgId,
          project_id: projectId,
          document_id: documentId,
          block_id: blockId,
          name: 'Description',
          key: 'description',
          type: 'text' as PropertyType,
          description: 'Requirement description',
          position: 20,
          is_required: false,
          is_hidden: false,
          created_by: userId,
          updated_by: userId,
          is_deleted: false,
          is_schema: true,
        },
        {
          org_id: orgId,
          project_id: projectId,
          document_id: documentId,
          block_id: blockId,
          name: 'ID',
          key: 'req_id',
          type: 'text' as PropertyType,
          description: 'Requirement ID',
          position: 30,
          is_required: false,
          is_hidden: false,
          created_by: userId,
          updated_by: userId,
          is_deleted: false,
          is_schema: true,
        }
      ];

      // Insert all properties in a single batch
      const { data, error } = await supabase
        .from('properties')
        .insert(defaultProperties)
        .select();

      if (error) {
        console.error('Error creating default properties:', error);
        throw error;
      }

      // Update local state and invalidate queries
      const newProperties = data as Property[];
      setProperties(prev => [...prev, ...newProperties].sort((a, b) => a.position - b.position));
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.byDocument(documentId)
      });
      
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.byBlock(blockId)
      });

      return newProperties;
    } catch (error) {
      console.error('Error in createDefaultProperties:', error);
      throw error;
    }
  }, [documentId, queryClient]);

  // Reorder properties
  const reorderProperties = useCallback(async (reorderedProperties: Property[], userId: string) => {
    try {
      // Update all positions in parallel for better performance
      await Promise.all(
        reorderedProperties.map((property, index) => 
          supabase
            .from('properties')
            .update({
              position: (index + 1) * 10, // Use 10, 20, 30... for positions to allow inserting in between
              updated_by: userId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', property.id)
        )
      );

      // Update local state with new positions
      setProperties(reorderedProperties.map((property, index) => ({
        ...property,
        position: (index + 1) * 10,
      })));
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.byDocument(documentId)
      });
      
      if (blockId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.properties.byBlock(blockId)
        });
      }

      return true;
    } catch (error) {
      console.error('Error in reorderProperties:', error);
      throw error;
    }
  }, [documentId, blockId, queryClient]);

  return {
    properties,
    isLoading,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    createDefaultProperties,
    reorderProperties,
  };
}; 