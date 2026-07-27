import client from './client'

export interface Organization {
  id: number
  name: string
  slug: string
  description?: string
  created_at: string
  updated_at: string
}

export async function getOrganizations(): Promise<Organization[]> {
  const res = await client.get<{ items: Organization[] }>('/organizations')
  return res.data.items
}
