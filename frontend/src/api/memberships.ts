import client from './client'

export interface Member {
  id: number
  user_id: number
  organization_id: number
  role_id: number
  status: string
  created_at: string
  updated_at: string
}

export interface MemberCreate {
  user_id: number
  role_id: number
}

export interface MemberUpdate {
  role_id?: number
  status?: string
}

export async function getMembers(orgId: number): Promise<Member[]> {
  const res = await client.get<Member[]>(`/organizations/${orgId}/members`)
  return res.data
}

export async function createMember(orgId: number, data: MemberCreate): Promise<Member> {
  const res = await client.post<Member>(`/organizations/${orgId}/members`, data)
  return res.data
}

export async function updateMember(orgId: number, memberId: number, data: MemberUpdate): Promise<Member> {
  const res = await client.put<Member>(`/organizations/${orgId}/members/${memberId}`, data)
  return res.data
}

export async function deleteMember(orgId: number, memberId: number): Promise<void> {
  await client.delete(`/organizations/${orgId}/members/${memberId}`)
}
