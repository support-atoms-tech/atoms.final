import { useQuery } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';

export function useAuthenticatedOrganization(orgId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: _authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.organizations.detail(orgId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error('Supabase client not available');
            }

            // Handle empty or invalid orgId more gracefully
            if (!orgId || orgId === '') {
                console.warn('Empty organization ID provided');
                return null;
            }

            // Skip validation for special cases like 'project'
            if (orgId === 'project') {
                console.warn('Special case organization ID:', orgId);
                return null;
            }

            // Validate that orgId is a valid UUID format before querying
            if (
                orgId === 'user' ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    orgId,
                )
            ) {
                console.error('Invalid organization ID format:', orgId);
                return null; // Return null instead of throwing to prevent UI errors
            }

            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', orgId)
                .eq('is_deleted', false)
                .single();

            if (error) {
                console.error('Error fetching organization:', error);
                throw error; // Throw error for proper error handling
            }
            return data;
        },
        enabled:
            !!orgId &&
            orgId !== 'user' &&
            orgId !== 'project' &&
            !authLoading &&
            !!supabase,
    });
}
