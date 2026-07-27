import client from './client'

export interface AdminStats {
  organizations: number
  members: number
  active_members: number
  users: number
}

export interface AdminUser {
  id: number
  name: string
  email: string
  is_super_admin: boolean
  is_active: boolean
}

export interface AdminOrganization {
  id: number
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await client.get<AdminStats>('/admin/stats')
  return res.data
}

export async function getAdminOrganizations(): Promise<AdminOrganization[]> {
  const res = await client.get<AdminOrganization[]>('/admin/organizations')
  return res.data
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await client.get<AdminUser[]>('/admin/users')
  return res.data
}
