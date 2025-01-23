import { useQuery } from '@tanstack/react-query'
import supabase from '@/lib/config/supabase'
import { queryKeys } from '@/lib/constants/queryKeys'
import { Project } from '@/types/base/projects.types'

export function useProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error
      return data as Project
    },
    enabled: !!projectId,
  })
}

export function useProjects(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('projects')
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
      return data as Project[]
    },
  })
}

export function useOrganizationProjects(organizationId: string) {
  return useQuery({
    queryKey: queryKeys.projects.byOrganization(organizationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Project[]
    },
    enabled: !!organizationId,
  })
}

export function useUserProjects(userId: string) {
  return useQuery({
    queryKey: queryKeys.projects.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owned_by', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Project[]
    },
    enabled: !!userId,
  })
} 