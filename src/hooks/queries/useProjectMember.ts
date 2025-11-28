import { useQuery } from '@tanstack/react-query';

import { ProjectRole } from '@/lib/auth/permissions';
import { queryKeys } from '@/lib/constants/queryKeys';

export function useProjectMemberRole(projectId: string, userId: string) {
    return useQuery({
        queryKey: queryKeys.roles.byProject(projectId),
        queryFn: async () => {
            const response = await fetch(`/api/projects/${projectId}/role`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                // Handle 403 (Forbidden) - user lost access, return null
                if (response.status === 403) {
                    console.warn(
                        `Access denied to project ${projectId}. Membership may have been removed.`,
                    );
                    return null;
                }

                const message = `Error fetching project role: ${response.statusText}`;
                console.error(message);
                throw new Error(message);
            }

            const payload = (await response.json()) as {
                role: ProjectRole;
            };

            return payload.role;
        },
        enabled: !!projectId && !!userId,
        retry: false,
        retryOnMount: false,
        throwOnError: false,
    });
}
