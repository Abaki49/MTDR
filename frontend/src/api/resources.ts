import client from './client'

export interface Resource {
  id: number
  organization_id: number
  title: string
  description: string | null
  storage_key: string
  visibility: 'PUBLIC' | 'PRIVATE'
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface ResourceCreate {
  title: string
  description?: string
  storage_key: string
  visibility?: 'PUBLIC' | 'PRIVATE'
}

export interface ResourceUpdate {
  title?: string
  description?: string | null
  storage_key?: string
  visibility?: 'PUBLIC' | 'PRIVATE'
}

export async function getResources(orgId: number): Promise<Resource[]> {
  const res = await client.get<Resource[]>(`/organizations/${orgId}/resources`)
  return res.data
}

export async function getResource(orgId: number, resourceId: number): Promise<Resource> {
  const res = await client.get<Resource>(`/organizations/${orgId}/resources/${resourceId}`)
  return res.data
}

export async function createResource(orgId: number, data: ResourceCreate): Promise<Resource> {
  const res = await client.post<Resource>(`/organizations/${orgId}/resources`, data)
  return res.data
}

export async function updateResource(orgId: number, resourceId: number, data: ResourceUpdate): Promise<Resource> {
  const res = await client.put<Resource>(`/organizations/${orgId}/resources/${resourceId}`, data)
  return res.data
}

export async function deleteResource(orgId: number, resourceId: number): Promise<void> {
  await client.delete(`/organizations/${orgId}/resources/${resourceId}`)
}

export async function publishResource(orgId: number, resourceId: number): Promise<Resource> {
  const res = await client.put<Resource>(`/organizations/${orgId}/resources/${resourceId}/publish`)
  return res.data
}

export async function archiveResource(orgId: number, resourceId: number): Promise<Resource> {
  const res = await client.put<Resource>(`/organizations/${orgId}/resources/${resourceId}/archive`)
  return res.data
}

export async function downloadResource(resourceId: number): Promise<void> {
  const res = await client.get(`/resources/${resourceId}/download`, { responseType: 'blob' })
  const disposition = res.headers['content-disposition']
  const match = disposition?.match(/filename="?(.+?)"?$/)
  const filename = match?.[1] ?? `resource-${resourceId}.json`
  const url = URL.createObjectURL(res.data)
  const a = window.document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
