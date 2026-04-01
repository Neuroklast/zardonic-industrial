/**
 * useCmsApi — typed API calls for all CMS endpoints.
 * Uses TanStack Query for caching and mutations.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Generic fetcher
// ---------------------------------------------------------------------------

async function cmsFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Site Config
// ---------------------------------------------------------------------------

export function useSiteConfig() {
  return useQuery({ queryKey: ['cms', 'site-config'], queryFn: () => cmsFetch('/api/cms/site-config') })
}

export function useSiteConfigMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      cmsFetch('/api/cms/site-config', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'site-config'] }) },
  })
}

// ---------------------------------------------------------------------------
// Releases
// ---------------------------------------------------------------------------

export function useReleases(): UseQueryResult<unknown[]> {
  return useQuery({ queryKey: ['cms', 'releases'], queryFn: () => cmsFetch('/api/cms/releases') }) as UseQueryResult<unknown[]>
}

export function useCreateRelease() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      cmsFetch('/api/cms/releases', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'releases'] }) },
  })
}

export function useUpdateRelease() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      cmsFetch(`/api/cms/releases?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'releases'] }) },
  })
}

export function useDeleteRelease() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cmsFetch(`/api/cms/releases?id=${id}`, { method: 'DELETE' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'releases'] }) },
  })
}

// ---------------------------------------------------------------------------
// Gigs
// ---------------------------------------------------------------------------

export function useGigs(): UseQueryResult<unknown[]> {
  return useQuery({ queryKey: ['cms', 'gigs'], queryFn: () => cmsFetch('/api/cms/gigs') }) as UseQueryResult<unknown[]>
}

export function useCreateGig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      cmsFetch('/api/cms/gigs', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'gigs'] }) },
  })
}

export function useUpdateGig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      cmsFetch(`/api/cms/gigs?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'gigs'] }) },
  })
}

export function useDeleteGig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cmsFetch(`/api/cms/gigs?id=${id}`, { method: 'DELETE' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'gigs'] }) },
  })
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

export function useVideos(): UseQueryResult<unknown[]> {
  return useQuery({ queryKey: ['cms', 'videos'], queryFn: () => cmsFetch('/api/cms/videos') }) as UseQueryResult<unknown[]>
}

export function useCreateVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      cmsFetch('/api/cms/videos', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'videos'] }) },
  })
}

export function useUpdateVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      cmsFetch(`/api/cms/videos?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'videos'] }) },
  })
}

export function useDeleteVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cmsFetch(`/api/cms/videos?id=${id}`, { method: 'DELETE' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'videos'] }) },
  })
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export function useMembers(): UseQueryResult<unknown[]> {
  return useQuery({ queryKey: ['cms', 'members'], queryFn: () => cmsFetch('/api/cms/members') }) as UseQueryResult<unknown[]>
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ slotIndex, ...data }: Record<string, unknown> & { slotIndex: number }) =>
      cmsFetch(`/api/cms/members?slotIndex=${slotIndex}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'members'] }) },
  })
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

export function useNews(): UseQueryResult<unknown[]> {
  return useQuery({ queryKey: ['cms', 'news'], queryFn: () => cmsFetch('/api/cms/news') }) as UseQueryResult<unknown[]>
}

export function useCreateNewsPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      cmsFetch('/api/cms/news', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'news'] }) },
  })
}

export function useUpdateNewsPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      cmsFetch(`/api/cms/news?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'news'] }) },
  })
}

export function useDeleteNewsPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cmsFetch(`/api/cms/news?id=${id}`, { method: 'DELETE' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'news'] }) },
  })
}

// ---------------------------------------------------------------------------
// Biography
// ---------------------------------------------------------------------------

export function useBiography() {
  return useQuery({ queryKey: ['cms', 'biography'], queryFn: () => cmsFetch('/api/cms/biography') })
}

export function useUpdateBiography() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      cmsFetch('/api/cms/biography', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'biography'] }) },
  })
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export function useSections(): UseQueryResult<unknown[]> {
  return useQuery({ queryKey: ['cms', 'sections'], queryFn: () => cmsFetch('/api/cms/sections') }) as UseQueryResult<unknown[]>
}

export function useUpdateSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      cmsFetch(`/api/cms/sections?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'sections'] }) },
  })
}

export function useReorderSections() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (order: Array<{ id: string; sortOrder: number }>) =>
      cmsFetch('/api/cms/sections?action=reorder', { method: 'PUT', body: JSON.stringify({ order }) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'sections'] }) },
  })
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

export function usePublish() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { entity: string; id: string; action: 'publish' | 'unpublish' }) =>
      cmsFetch('/api/cms/publish', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['cms', vars.entity + 's'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

export function useActivityLog(params?: { limit?: number; offset?: number; entity?: string }) {
  const query = new URLSearchParams()
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))
  if (params?.entity) query.set('entity', params.entity)
  return useQuery({
    queryKey: ['cms', 'activity-log', params],
    queryFn: () => cmsFetch(`/api/cms/activity-log?${query.toString()}`),
  })
}
