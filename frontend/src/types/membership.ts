export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'INVITED'

export interface Membership {
  id: number
  organization_id: number
  user_id: number
  role_id: number
  status: MembershipStatus
  user_name: string
  user_email: string
  role_name: string
  created_at: string
  updated_at: string
}

export interface MembershipCreate {
  user_id: number
  role_id: number
}

export interface MembershipUpdate {
  role_id?: number
  status?: MembershipStatus
}
