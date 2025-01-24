import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseBrowser'
import { queryKeys } from '@/lib/constants/queryKeys'
import { Organization, OrganizationMembers } from '@/types/base/organizations.types'

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

export function useOrganizationsByMembership(userId: string) {
    return useQuery({
      queryKey: queryKeys.organizations.byUser(userId),
      queryFn: async () => {
        // Fetch the organization IDs the user is part of
        const { data: memberships, error: membershipsError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId)
  
        if (membershipsError) throw membershipsError
  
        const organizationIds = memberships.map((member) => member.organization_id)
  
        // Fetch the organizations based on the IDs
        const { data: organizations, error: organizationsError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', organizationIds)
  
        if (organizationsError) throw organizationsError
  
        return organizations as Organization[]
      },
      enabled: !!userId,
    })
  }