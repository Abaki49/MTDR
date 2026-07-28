export interface Organization {
  id: number
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationCreate {
  name: string
  slug?: string
  description?: string
}

export interface OrganizationUpdate {
  name?: string
  slug?: string
  description?: string
}
