import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { debugConfig } from '@/lib/utils/env-validation';
import { Database } from '@/types/base/database.types';

export type ProfileInput = Database['public']['Tables']['profiles']['Update'];

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    const ensureSupabaseClient = () => {
        if (authLoading) {
            throw new Error('Supabase client is still initializing');
        }
        if (!supabase) {
            throw new Error(authError ?? 'Supabase client not available');
        }

        return supabase;
    };

    return useMutation({
        mutationFn: async (input: ProfileInput) => {
            if (!input.id) throw new Error('No Profile Id Provided');

            const client = ensureSupabaseClient();
            const shouldLog = debugConfig.debugRLSQueries();

            const updatePayload = {
                ...input,
                updated_at: new Date().toISOString(),
            };

            if (shouldLog) {
                console.log('=== PROFILE UPDATE QUERY DEBUG ===');
                console.log(
                    'Endpoint:',
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${input.id}`,
                );
                console.log('Method:', 'PATCH');
                console.log('Payload:', updatePayload);
                console.log('User ID:', input.id);
                console.log('===========================================');
            }

            const { error, data } = await client
                .from('profiles')
                .update(updatePayload)
                .eq('id', input.id)
                .select();

            if (error) {
                if (shouldLog) {
                    console.error('=== PROFILE UPDATE ERROR ===');
                    console.error('Error Code:', error.code);
                    console.error('Error Message:', error.message);
                    console.error('Error Details:', error.details);
                    console.error('Error Hint:', error.hint);
                    console.error('User ID:', input.id);
                    console.error('Payload:', updatePayload);
                    console.error('================================');
                }
                throw new Error('Error Updating Profile');
            }

            if (shouldLog) {
                console.log('=== PROFILE UPDATE SUCCESS ===');
                console.log('Updated Profile:', data);
                console.log('================================');
            }
        },
        onSuccess: (_, variables) => {
            // Invalidate relevant queries
            if (!variables.id) return;
            queryClient.invalidateQueries({
                queryKey: queryKeys.profiles.detail(variables.id),
            });
            if (!variables.email) return;
            queryClient.invalidateQueries({
                queryKey: queryKeys.profiles.byEmail(variables.email),
            });
        },
    });
}
