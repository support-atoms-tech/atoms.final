// components/canvas/TableBlock/menu/PropertySelector.tsx
'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { useTableColumns } from '@/components/Canvas/lib/hooks/canvas/useTableColumns';
import { Property } from '@/components/Canvas/types';
import { PropertyScope } from '@/components/Canvas/lib/hooks/query/usePropertiesQuery';
import { useUIStore } from '@/components/Canvas/lib/store/uiStore';
// Define PropertyType enum since it's not exported from types
type PropertyType = 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'url' | 'email' | 'user';

interface PropertySelectorProps {
  blockId: string;
  onSelect: (propertyId: string) => void;
  onCancel: () => void;
}

export const PropertySelector = memo(function PropertySelector({ 
  blockId, 
  onSelect, 
  onCancel 
}: PropertySelectorProps) {
  const { document } = useDocument();
  const { 
    baseProperties,
    projectProperties,
    documentProperties,
    createPropertyAndColumn
  } = useTableColumns({ blockId });
  const { activeOrgId } = useUIStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: '',
    property_type: 'text' as PropertyType,
    scope: 'document' as PropertyScope
  });

  // Handle property creation - memoize to prevent recreation on each render
  const handleCreateProperty = useCallback(async () => {
    try {
      // Extract org ID from document ID or use a fallback
      const orgId = activeOrgId; 
      
      if (!orgId) {
        console.error('Cannot create property: orgId is missing');
        return;
      }
      
      const propertyData = {
        ...newProperty,
        org_id: orgId,
        name: newProperty.name.trim()
      };

      const property = await createPropertyAndColumn(propertyData);
      onSelect(property.id);
    } catch (error) {
      console.error('Error creating property:', error);
    }
  }, [activeOrgId, createPropertyAndColumn, newProperty, onSelect]);

  // Handle property name change
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewProperty(prev => ({ ...prev, name: e.target.value }));
  }, []);

  // Handle property type change
  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewProperty(prev => ({ 
      ...prev, 
      property_type: e.target.value as PropertyType 
    }));
  }, []);

  // Handle property scope change
  const handleScopeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewProperty(prev => ({ 
      ...prev, 
      scope: e.target.value as PropertyScope
    }));
  }, []);

  // Memoize the property sections to prevent recreation on each render
  const basePropertiesSection = useMemo(() => (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Base Properties</h3>
      <div className="space-y-1">
        {baseProperties.map(property => (
          <button
            key={property.id}
            onClick={() => onSelect(property.id)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
          >
            {property.name}
          </button>
        ))}
      </div>
    </div>
  ), [baseProperties, onSelect]);

  const projectPropertiesSection = useMemo(() => (
    projectProperties.length > 0 && (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Project Properties</h3>
        <div className="space-y-1">
          {projectProperties.map(property => (
            <button
              key={property.id}
              onClick={() => onSelect(property.id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
            >
              {property.name}
            </button>
          ))}
        </div>
      </div>
    )
  ), [projectProperties, onSelect]);

  const documentPropertiesSection = useMemo(() => (
    documentProperties.length > 0 && (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Document Properties</h3>
        <div className="space-y-1">
          {documentProperties.map(property => (
            <button
              key={property.id}
              onClick={() => onSelect(property.id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
            >
              {property.name}
            </button>
          ))}
        </div>
      </div>
    )
  ), [documentProperties, onSelect]);

  return (
    <div className="property-selector p-4 bg-white border rounded-lg shadow-lg">
      {!isCreating ? (
        <div className="space-y-4">
          {/* Base Properties */}
          {basePropertiesSection}

          {/* Project Properties */}
          {projectPropertiesSection}

          {/* Document Properties */}
          {documentPropertiesSection}

          {/* Create New Property Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="w-full mt-4 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
          >
            Create New Property
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Create New Property</h3>
          
          {/* Property Name */}
          <div>
            <label className="block text-sm text-gray-600">Name</label>
            <input
              type="text"
              value={newProperty.name}
              onChange={handleNameChange}
              className="mt-1 w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm text-gray-600">Type</label>
            <select
              value={newProperty.property_type}
              onChange={handleTypeChange}
              className="mt-1 w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
              <option value="multi_select">Multi Select</option>
              <option value="date">Date</option>
              <option value="checkbox">Checkbox</option>
              <option value="url">URL</option>
              <option value="email">Email</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Property Scope */}
          <div>
            <label className="block text-sm text-gray-600">Scope</label>
            <select
              value={newProperty.scope}
              onChange={handleScopeChange}
              className="mt-1 w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="document">This Document</option>
              <option value="project">Entire Project</option>
              <option value="org">Organization-wide</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProperty}
              disabled={!newProperty.name}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
            >
              Create Property
            </button>
          </div>
        </div>
      )}
    </div>
  );
});