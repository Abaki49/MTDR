export interface PermissionOverride {
  permission_id: number
  allowed: boolean
}

export interface PermissionOverrideResponse {
  permission_id: number
  permission_name: string
  allowed: boolean
  is_default: boolean
}
