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

export interface MembershipInfo {
  id: number
  organization_id: number
  organization_name: string
  role_id: number
  role_name: string
  status: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface LoginResponse extends TokenResponse {}
