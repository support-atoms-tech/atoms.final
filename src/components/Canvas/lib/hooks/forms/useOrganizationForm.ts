// hooks/forms/useOrganizationForm.ts
import { useState, useCallback } from 'react';
import { useOrganizationsQuery } from '@/components/Canvas/lib/hooks/query/useOrganizationsQuery';
import { Organization, OrganizationType, BillingPlan, PricingPlanInterval } from '@/components/Canvas/types';

interface OrganizationFormState {
  name: string;
  description: string;
  type: OrganizationType;
  billing_plan: BillingPlan;
  billing_cycle: PricingPlanInterval;
}

interface UseOrganizationFormProps {
  initialData?: Partial<Organization>;
  onSubmitSuccess?: (organization: Organization) => void;
}

export function useOrganizationForm({ initialData = {}, onSubmitSuccess }: UseOrganizationFormProps = {}) {
  // Get mutation functions
  const { createOrganization, updateOrganization } = useOrganizationsQuery();
  
  // Form state
  const [formState, setFormState] = useState<OrganizationFormState>({
    name: initialData.name || '',
    description: initialData.description || '',
    type: initialData.type || 'team',
    billing_plan: initialData.billing_plan || 'free',
    billing_cycle: initialData.billing_cycle || 'month'
  });
  
  // Loading and error state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Handle field changes
  const handleChange = useCallback((field: keyof OrganizationFormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formState.name.trim()) {
        throw new Error('Organization name is required');
      }
      
      // Create or update organization
      let organization: Organization;
      
      if (initialData.id) {
        // Update existing organization
        organization = await updateOrganization({
          id: initialData.id,
          name: formState.name,
          description: formState.description,
          type: formState.type,
          billing_plan: formState.billing_plan,
          billing_cycle: formState.billing_cycle
        });
      } else {
        // Create new organization
        organization = await createOrganization({
          name: formState.name,
          description: formState.description,
          type: formState.type,
          billing_plan: formState.billing_plan,
          billing_cycle: formState.billing_cycle,
          slug: formState.name.toLowerCase().replace(/\s+/g, '-'),
          status: 'active',
          max_members: 5,
          max_monthly_requests: 1000,
          owner_id: 'current-user',
          logo_url: '',
          settings: {},
          metadata: {},
          member_count: 1,
          storage_used: 0
        });
      }
      
      // Call success callback
      if (onSubmitSuccess) {
        onSubmitSuccess(organization);
      }
      
      return organization;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save organization'));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, initialData.id, createOrganization, updateOrganization, onSubmitSuccess]);
  
  return {
    formState,
    handleChange,
    handleSubmit,
    isSubmitting,
    error,
    isEditMode: !!initialData.id
  };
}

