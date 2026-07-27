import client from './client'

export interface Organization {
  id: number
  name: string
  slug: string
  description?: string
  created_at: string
  updated_at: string
}

export interface OrgCreate {
  name: string
  slug?: string
  description?: string
}

export interface OrgUpdate {
  name?: string
  slug?: string
  description?: string
}

export async function getOrganizations(): Promise<Organization[]> {
  const res = await client.get<{ items: Organization[] }>('/organizations')
  return res.data.items
}

export async function createOrganization(data: OrgCreate): Promise<Organization> {
  const res = await client.post<Organization>('/organizations', data)
  return res.data
}

export async function updateOrganization(id: number, data: OrgUpdate): Promise<Organization> {
  const res = await client.put<Organization>(`/organizations/${id}`, data)
  return res.data
}

export async function deleteOrganization(id: number): Promise<void> {
  await client.delete(`/organizations/${id}`)
}
