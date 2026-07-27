export interface MembershipInfo {
  organization_id: number
  organization_name: string
  role_name: string
  status: string
}

export interface User {
  id: number
  name: string
  email: string
  is_super_admin: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  memberships: MembershipInfo[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface RefreshRequest {
  refresh_token: string
}
