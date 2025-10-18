import { useQuery } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';

export function useAuthenticatedProjectsByMembershipForOrg(
    orgId: string,
    userId: string,
) {
    const {
        supabase,
        isLoading: authLoading,
        error: _authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.projects.byOrg(orgId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error('Supabase client not available');
            }

            // First get project memberships for the user in this org
            const { data: memberships, error: membershipError } = await supabase
                .from('project_members')
                .select('project_id')
                .eq('org_id', orgId) // Filter by organization ID
                .eq('user_id', userId) // Filter by user ID
                .eq('status', 'active'); // Ensure the membership is active

            if (membershipError) {
                console.error('Error fetching project memberships:', membershipError);
                throw membershipError;
            }

            const projectIds = memberships.map((member) => member.project_id);

            // If no memberships, return empty array
            if (projectIds.length === 0) {
                return [];
            }

            // Then get the actual projects
            const { data: projects, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .in('id', projectIds)
                .eq('organization_id', orgId) // Ensure projects belong to the organization
                .eq('is_deleted', false); // Exclude deleted projects

            if (projectError) {
                console.error('Error fetching projects:', projectError);
                throw projectError;
            }

            return projects;
        },
        enabled: !!orgId && !!userId && !authLoading && !!supabase,
    });
}
