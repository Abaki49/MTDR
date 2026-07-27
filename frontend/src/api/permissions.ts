import client from './client'

export interface PermissionOverride {
  permission_id: number
  allowed: boolean
}

export interface PermissionOverrideResponse {
  permission_id: number
  permission_name: string
  allowed: boolean
  source: string
}

export async function getRolePermissions(orgId: number, roleId: number): Promise<PermissionOverrideResponse[]> {
  const res = await client.get<PermissionOverrideResponse[]>(`/organizations/${orgId}/roles/${roleId}/permissions`)
  return res.data
}

export async function updateRolePermissions(orgId: number, roleId: number, data: PermissionOverride[]): Promise<void> {
  await client.put(`/organizations/${orgId}/roles/${roleId}/permissions`, data)
}
