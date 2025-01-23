import { useQuery } from '@tanstack/react-query'
import supabase from '@/lib/config/supabase'
import { queryKeys } from '@/lib/constants/queryKeys'
import { Organization } from '@/types/base/organizations.types'

export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (error) throw error
      return data as Organization
    },
    enabled: !!orgId,
  })
}

export function useOrganizations(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.organizations.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('organizations')
        .select('*')

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value)
          }
        })
      }

      const { data, error } = await query

      if (error) throw error
      return data as Organization[]
    },
  })
} 