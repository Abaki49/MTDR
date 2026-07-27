import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { Modal, SelectField } from '../components/Modal'
import { getAdminStats, getAdminOrganizations, getAdminUsers, type AdminOrganization, type AdminUser } from '../api/admin'
import { createOrganization, updateOrganization, deleteOrganization, type OrgCreate } from '../api/organizations'
import { getRoles, type Role } from '../api/roles'
import { createMember, getMembers, updateMember, deleteMember, type Member, type MemberCreate } from '../api/memberships'

export function AdminPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOrg, setEditOrg] = useState<AdminOrganization | null>(null)
  const [expandedOrg, setExpandedOrg] = useState<number | null>(null)
  const [addMemberOrg, setAddMemberOrg] = useState<number | null>(null)

  const { data: stats } = useQuery({ queryKey: ['adminStats'], queryFn: getAdminStats })
  const { data: orgs = [], isLoading: orgsLoading } = useQuery({ queryKey: ['adminOrgs'], queryFn: getAdminOrganizations })
  const { data: users = [] } = useQuery({ queryKey: ['adminUsers'], queryFn: getAdminUsers })

  const { data: expandedMembers } = useQuery({
    queryKey: ['adminMembers', expandedOrg],
    queryFn: () => getMembers(expandedOrg!),
    enabled: expandedOrg !== null,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['adminRoles', expandedOrg],
    queryFn: () => getRoles(expandedOrg!),
    enabled: expandedOrg !== null,
  })

  const createMutation = useMutation({
    mutationFn: (data: OrgCreate) => createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrgs'] })
      queryClient.invalidateQueries({ queryKey: ['adminStats'] })
      setCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: OrgCreate }) => updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrgs'] })
      setEditOrg(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrgs'] })
      queryClient.invalidateQueries({ queryKey: ['adminStats'] })
      if (expandedOrg) setExpandedOrg(null)
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: ({ orgId, data }: { orgId: number; data: MemberCreate }) => createMember(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMembers', expandedOrg] })
      setAddMemberOrg(null)
    },
  })

  const deleteMemberMutation = useMutation({
    mutationFn: ({ orgId, memberId }: { orgId: number; memberId: number }) => deleteMember(orgId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMembers', expandedOrg] })
    },
  })

  if (!user?.is_super_admin) {
    return <div className="state-message"><h3>Access Denied</h3><p>Only super admins can access this page.</p></div>
  }

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }))

  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: r.name,
  }))

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Admin Panel</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>Manage organizations and users</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          + New Organization
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="label">Organizations</div>
          <div className="value primary">{stats?.organizations ?? '-'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Members</div>
          <div className="value success">{stats?.members ?? '-'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active Members</div>
          <div className="value">{stats?.active_members ?? '-'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Users</div>
          <div className="value warning">{stats?.users ?? '-'}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>All Organizations</h2>
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{orgs.length} total</span>
        </div>
        {orgsLoading ? (
          <div className="card-body"><p style={{ color: 'var(--gray-500)' }}>Loading...</p></div>
        ) : orgs.length === 0 ? (
          <div className="card-body"><p style={{ color: 'var(--gray-500)' }}>No organizations yet.</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <>
                    <tr
                      key={org.id}
                      onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 500 }}>{org.id}</td>
                      <td>
                        <strong>{org.name}</strong>
                        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--gray-400)' }}>
                          {expandedOrg === org.id ? '▲' : '▼'}
                        </span>
                      </td>
                      <td><code style={{ fontSize: 13 }}>{org.slug}</code></td>
                      <td style={{ color: org.description ? 'inherit' : 'var(--gray-400)' }}>
                        {org.description || '—'}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => { e.stopPropagation(); setEditOrg(org) }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Delete "${org.name}"? This cannot be undone.`))
                                deleteMutation.mutate(org.id)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedOrg === org.id && (
                      <tr key={`${org.id}-members`}>
                        <td colSpan={6} style={{ padding: 0, background: 'var(--gray-50)' }}>
                          <div style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                                Members of {org.name}
                              </h4>
                              <button className="btn btn-primary btn-sm" onClick={() => setAddMemberOrg(org.id)}>
                                + Add Member
                              </button>
                            </div>
                            <table className="data-table" style={{ fontSize: 13 }}>
                              <thead>
                                <tr>
                                  <th>ID</th>
                                  <th>User</th>
                                  <th>Role</th>
                                  <th>Status</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(expandedMembers ?? []).length === 0 ? (
                                  <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: 'var(--gray-400)' }}>No members</td></tr>
                                ) : (
                                  (expandedMembers ?? []).map((m) => {
                                    const memberUser = users.find((u) => u.id === m.user_id)
                                    const memberRole = roles.find((r) => r.id === m.role_id)
                                    return (
                                      <tr key={m.id}>
                                        <td>{m.id}</td>
                                        <td>
                                          {memberUser ? (
                                            <span>{memberUser.name} <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>({memberUser.email})</span></span>
                                          ) : (
                                            `User #${m.user_id}`
                                          )}
                                        </td>
                                        <td>{memberRole?.name ?? m.role_id}</td>
                                        <td>
                                          <span className={`badge badge-${m.status === 'ACTIVE' ? 'success' : m.status === 'SUSPENDED' ? 'danger' : 'neutral'}`}>
                                            {m.status}
                                          </span>
                                        </td>
                                        <td>
                                          <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => {
                                              if (confirm('Remove this member?'))
                                                deleteMemberMutation.mutate({ orgId: org.id, memberId: m.id })
                                            }}
                                          >
                                            Remove
                                          </button>
                                        </td>
                                      </tr>
                                    )
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateOrgModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
        error={createMutation.error?.message}
      />

      {editOrg && (
        <EditOrgModal
          org={editOrg}
          onClose={() => setEditOrg(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editOrg.id, data })}
          isSubmitting={updateMutation.isPending}
          error={updateMutation.error?.message}
        />
      )}

      {addMemberOrg !== null && (
        <AddMemberModal
          orgName={orgs.find((o) => o.id === addMemberOrg)?.name ?? `Org #${addMemberOrg}`}
          userOptions={userOptions}
          roleOptions={roleOptions}
          onClose={() => setAddMemberOrg(null)}
          onSubmit={(data) => addMemberMutation.mutate({ orgId: addMemberOrg, data })}
          isSubmitting={addMemberMutation.isPending}
          error={addMemberMutation.error?.message}
        />
      )}
    </div>
  )
}

/* ─── Modals ─── */

function CreateOrgModal({
  open, onClose, onSubmit, isSubmitting, error,
}: {
  open: boolean; onClose: () => void; onSubmit: (data: OrgCreate) => void
  isSubmitting: boolean; error?: string
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ name, slug: slug || undefined, description: description || undefined })
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Organization">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Organization" required />
          </div>
          <div className="form-group">
            <label className="form-label">Slug</label>
            <input className="form-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-organization (auto if empty)" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EditOrgModal({
  org, onClose, onSubmit, isSubmitting, error,
}: {
  org: AdminOrganization; onClose: () => void; onSubmit: (data: OrgCreate) => void
  isSubmitting: boolean; error?: string
}) {
  const [name, setName] = useState(org.name)
  const [slug, setSlug] = useState(org.slug)
  const [description, setDescription] = useState(org.description ?? '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ name, slug: slug || undefined, description: description || undefined })
  }

  return (
    <Modal open onClose={onClose} title="Edit Organization">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Slug</label>
            <input className="form-input" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AddMemberModal({
  orgName, userOptions, roleOptions, onClose, onSubmit, isSubmitting, error,
}: {
  orgName: string
  userOptions: { value: number; label: string }[]
  roleOptions: { value: number; label: string }[]
  onClose: () => void
  onSubmit: (data: MemberCreate) => void
  isSubmitting: boolean
  error?: string
}) {
  const [userId, setUserId] = useState('')
  const [roleId, setRoleId] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ user_id: parseInt(userId, 10), role_id: parseInt(roleId, 10) })
  }

  return (
    <Modal open onClose={onClose} title={`Add Member to ${orgName}`}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <SelectField label="User" name="user_id" value={userId} onChange={setUserId} options={userOptions} required />
          <SelectField label="Role" name="role_id" value={roleId} onChange={setRoleId} options={roleOptions} required />
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
