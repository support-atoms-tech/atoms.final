import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { Database } from '@/types/base/database.types';

export type OrganizationInvitationInput = Omit<
    Database['public']['Tables']['organization_invitations']['Insert'],
    'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'deleted_by' | 'is_deleted'
>;

export function useCreateOrgInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: OrganizationInvitationInput) => {
            const response = await fetch(
                `/api/organizations/${input.organization_id}/invitations`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: input.email,
                        role: input.role || 'member',
                    }),
                    cache: 'no-store',
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || 'Failed to create organization invitation',
                );
            }

            const result = await response.json();
            return result.invitation;
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.organizationInvitations.byOrg(data.organization_id),
            });
        },
    });
}
