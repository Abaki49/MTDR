import client from './client'

export interface Role {
  id: number
  name: string
  is_system: boolean
  rank: number
  caller_can_assign: boolean
}

export async function getRoles(orgId: number): Promise<Role[]> {
  const res = await client.get<Role[]>(`/organizations/${orgId}/roles`)
  return res.data
}
