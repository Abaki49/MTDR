import client from './client'

export interface UserSearchResult {
  id: number
  name: string
  email: string
  is_super_admin: boolean
  is_active: boolean
}

export async function searchUsers(q: string): Promise<UserSearchResult[]> {
  if (!q.trim()) return []
  const res = await client.get<UserSearchResult[]>('/users/search', { params: { q: q.trim() } })
  return res.data
}
