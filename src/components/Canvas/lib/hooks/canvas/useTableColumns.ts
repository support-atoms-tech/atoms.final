import { useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePropertiesQuery, PropertyScope } from '@/components/Canvas/lib/hooks/query/usePropertiesQuery';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { Column, Property } from '@/components/Canvas/types';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { useUIStore } from '../../store/uiStore';
import { useCanvasStore } from '../../store/canvasStore';

interface UseTableColumnsProps {
  blockId: string;
}

interface ColumnData {
  id: string;
  block_id: string;
  property_id: string;
  position: number;
  is_hidden: boolean;
  width: number;
  is_pinned?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Track which blocks have already initialized columns to prevent duplicate initialization
const initializedBlocks = new Set<string>();

export function useTableColumns({ blockId }: UseTableColumnsProps) {
  const queryClient = useQueryClient();
  const { document } = useDocument();
  const { block } = useBlock();
  const { activeOrgId } = useUIStore();
  const { clientId } = useCanvasStore();
  
  // Memoize the orgId to prevent unnecessary re-renders
  const orgId = useMemo(() => 
    activeOrgId || '',
    [activeOrgId, document?.id]
  );
  
  // Get properties at all scopes
  const { 
    baseProperties,
    projectProperties, 
    documentProperties,
    createProperty
  } = usePropertiesQuery({
    orgId,
    projectId: document?.project_id,
    documentId: document?.id
  });

  // Combine all properties for easier lookup
  const allProperties = useMemo(() => {
    return [...baseProperties, ...projectProperties, ...documentProperties];
  }, [baseProperties, projectProperties, documentProperties]);

  // Fetch block columns with increased staleTime
  const columnsQuery = useQuery<ColumnData[]>({
    queryKey: ['columns', blockId],
    queryFn: async () => {
      const { data } = await supabase
        .from('columns')
        .select('*')
        .eq('block_id', blockId)
        .order('position');
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  });

  // Create default columns for base properties if none exist
  const initializeDefaultColumns = useMutation({
    mutationFn: async () => {
      // First check if ANY columns exist for this block
      const { count } = await supabase
        .from('columns')
        .select('id', { count: 'exact' })
        .eq('block_id', blockId);
        
      if (count && count > 0) {
        // Skip if any columns exist
        initializedBlocks.add(blockId);
        return [] as ColumnData[];
      }
      
      // Create columns for base properties
      const defaultColumns = baseProperties.map((prop, index) => ({
        block_id: blockId,
        property_id: prop.id,
        position: index,
        is_hidden: false,
        width: 150,
        is_pinned: false,
        client_id: clientId, // Add client ID to track origin
        operation_id: `init-${blockId}-${Date.now()}` // Add operation ID to prevent loops
      }));

      const { data, error } = await supabase
        .from('columns')
        .insert(defaultColumns)
        .select();
        
      if (error) throw error;
      
      // Mark this block as initialized
      initializedBlocks.add(blockId);
      return data as ColumnData[] || [];
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        queryClient.setQueryData(['columns', blockId], data);
      }
    }
  });

  // Create new column - memoize the mutation function
  const createColumn = useMutation({
    mutationFn: async ({ 
      propertyId, 
      position 
    }: { 
      propertyId: string; 
      position?: number 
    }) => {
      // Check if column already exists for this property
      const { data: existingColumns } = await supabase
        .from('columns')
        .select('id')
        .eq('block_id', blockId)
        .eq('property_id', propertyId);
        
      if (existingColumns && existingColumns.length > 0) {
        // Column already exists, return it
        return existingColumns[0] as ColumnData;
      }
      
      const { data, error } = await supabase
        .from('columns')
        .insert([{
          block_id: blockId,
          property_id: propertyId,
          position: position || (columnsQuery.data?.length || 0),
          is_hidden: false,
          width: 150,
          is_pinned: false,
          client_id: clientId, // Add client ID to track origin
          operation_id: `create-${propertyId}-${Date.now()}` // Add operation ID to prevent loops
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data as ColumnData;
    },
    onSuccess: (newColumn) => {
      queryClient.setQueryData<ColumnData[]>(['columns', blockId], (oldData = []) => {
        // Only add if not already in the cache
        if (!oldData.some(col => col.id === newColumn.id)) {
          return [...oldData, newColumn];
        }
        return oldData;
      });
    }
  });

  // Create property and column together - memoize to prevent recreation on each render
  const createPropertyAndColumn = useCallback(async (propertyData: Partial<Property> & { scope?: PropertyScope }) => {
    // Create property first
    const newProperty = await createProperty(propertyData);
    
    // Then create column with the new property
    await createColumn.mutateAsync({ propertyId: newProperty.id });
    
    return newProperty;
  }, [createProperty, createColumn]);

  // Get columns with their properties
  const columnsWithProperties = useMemo(() => {
    if (!columnsQuery.data) return [];

    return columnsQuery.data.map((column: ColumnData) => {
      // Find the property for this column
      const property = allProperties.find(p => p.id === column.property_id);
      
      // If property is not found, create a placeholder to prevent errors
      const safeProperty = property || {
        id: column.property_id,
        name: 'Unknown Property',
        property_type: 'text',
        org_id: activeOrgId || '',
        document_id: document?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return {
        ...column,
        property: safeProperty
      } as Column;
    });
  }, [columnsQuery.data, allProperties, activeOrgId, document?.id]);

  // Initialize default columns if needed - using useEffect to prevent infinite updates
  useEffect(() => {
    if (
      columnsQuery.data && 
      columnsQuery.data.length === 0 && 
      baseProperties.length > 0 && 
      !initializedBlocks.has(blockId)
    ) {
      initializeDefaultColumns.mutate();
    }
  }, [columnsQuery.data, baseProperties.length, blockId, initializeDefaultColumns]);

  return {
    columns: columnsWithProperties,
    isLoading: columnsQuery.isLoading,
    createColumn: createColumn.mutateAsync,
    createPropertyAndColumn,
    baseProperties,
    projectProperties,
    documentProperties,
    allProperties
  };
} 