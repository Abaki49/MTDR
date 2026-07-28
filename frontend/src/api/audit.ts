import client from './client'

export interface AuditLog {
  id: number
  organization_id: number | null
  actor_id: number
  actor_name: string
  action: string
  entity_type: string
  entity_id: number | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  created_at: string
}

export async function getAuditLogs(orgId: number): Promise<AuditLog[]> {
  const res = await client.get<AuditLog[]>(`/organizations/${orgId}/audit-logs`)
  return res.data
}
