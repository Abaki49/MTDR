export type ResourceVisibility = 'PUBLIC' | 'PRIVATE'

export interface Resource {
  id: number
  organization_id: number
  title: string
  description: string | null
  storage_key: string
  visibility: ResourceVisibility
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface ResourceCreate {
  title: string
  description?: string
  storage_key: string
  visibility?: ResourceVisibility
}

export interface ResourceUpdate {
  title?: string
  description?: string | null
  storage_key?: string
  visibility?: ResourceVisibility
}
