import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Modal } from '../components/Modal'
import { ConfirmModal } from '../components/ConfirmModal'
import { TableSkeleton } from '../components/Skeleton'
import { getAdminStats, getAdminOrganizations, getAdminUsers, type AdminOrganization, type AdminUser } from '../api/admin'
import { createOrganization, updateOrganization, deleteOrganization, type OrgCreate } from '../api/organizations'

export function AdminPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOrg, setEditOrg] = useState<AdminOrganization | null>(null)
  const [deleteOrg, setDeleteOrg] = useState<AdminOrganization | null>(null)

  const { data: stats } = useQuery({ queryKey: ['adminStats'], queryFn: getAdminStats })
  const { data: orgs = [], isLoading: orgsLoading } = useQuery({ queryKey: ['adminOrgs'], queryFn: getAdminOrganizations })
  const { data: users = [], isLoading: usersLoading } = useQuery({ queryKey: ['adminUsers'], queryFn: getAdminUsers })

  const createMutation = useMutation({
    mutationFn: (data: OrgCreate) => createOrganization(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['adminOrgs'] })
      queryClient.invalidateQueries({ queryKey: ['adminStats'] })
      setCreateOpen(false)
      toast('Organization created successfully', 'success')
      navigate(`/organizations/${created.id}/members`)
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.detail || 'Failed to create organization'
      toast(msg, 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: OrgCreate }) => updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrgs'] })
      setEditOrg(null)
      toast('Organization updated successfully', 'success')
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.detail || 'Failed to update organization'
      toast(msg, 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrgs'] })
      queryClient.invalidateQueries({ queryKey: ['adminStats'] })
      setDeleteOrg(null)
      toast('Organization deleted successfully', 'success')
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.detail || 'Failed to delete organization'
      toast(msg, 'error')
    },
  })

  if (!user?.is_super_admin) {
    return <div className="state-message"><h3>Access Denied</h3><p>Only super admins can access this page.</p></div>
  }

  const [activeTab, setActiveTab] = useState<'orgs' | 'users'>('orgs')

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Admin Panel</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>Manage organizations and users</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/audit-logs')}>
            Audit Logs
          </button>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            + New Organization
          </button>
        </div>
      </div>

      <div className="tab-nav" style={{ marginBottom: 24 }}>
        <button
          className={`tab-nav-link${activeTab === 'orgs' ? ' active' : ''}`}
          onClick={() => setActiveTab('orgs')}
        >
          Organizations
        </button>
        <button
          className={`tab-nav-link${activeTab === 'users' ? ' active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="label">Organizations</div>
          <div className="value primary">{stats?.organizations ?? '\u2014'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Members</div>
          <div className="value success">{stats?.members ?? '\u2014'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active Members</div>
          <div className="value">{stats?.active_members ?? '\u2014'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Users</div>
          <div className="value warning">{stats?.users ?? '\u2014'}</div>
        </div>
      </div>

      {activeTab === 'orgs' && (
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2>All Organizations</h2>
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{orgs.length} total</span>
        </div>
        {orgsLoading ? (
          <TableSkeleton rows={3} cols={6} />
        ) : orgs.length === 0 ? (
          <div className="card-body"><p style={{ color: 'var(--gray-500)' }}>No organizations yet. Create one to get started.</p></div>
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
                  <tr key={org.id}>
                    <td style={{ fontWeight: 500, color: 'var(--gray-500)' }}>{org.id}</td>
                    <td><strong>{org.name}</strong></td>
                    <td><code style={{ fontSize: 13 }}>{org.slug}</code></td>
                    <td style={{ color: org.description ? 'inherit' : 'var(--gray-400)' }}>
                      {org.description || '\u2014'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/organizations/${org.id}/members`)}
                          title="Manage members & view organization"
                        >
                          Manage
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditOrg(org)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteOrg(org)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {activeTab === 'users' && (
      <div className="card">
        <div className="card-header">
          <h2>Users</h2>
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{users.length} total</span>
        </div>
        {usersLoading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : users.length === 0 ? (
          <div className="card-body"><p style={{ color: 'var(--gray-500)' }}>No users found.</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500, color: 'var(--gray-500)' }}>{u.id}</td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.is_active ? 'success' : 'danger'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      {u.is_super_admin ? (
                        <span className="badge badge-info">Super Admin</span>
                      ) : (
                        <span className="badge badge-neutral">User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      <CreateOrgModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
        error={(createMutation.error as Error)?.message}
      />

      {editOrg && (
        <EditOrgModal
          org={editOrg}
          onClose={() => setEditOrg(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editOrg.id, data })}
          isSubmitting={updateMutation.isPending}
          error={(updateMutation.error as Error)?.message}
        />
      )}

      <ConfirmModal
        open={!!deleteOrg}
        onClose={() => setDeleteOrg(null)}
        onConfirm={() => deleteOrg && deleteMutation.mutate(deleteOrg.id)}
        title="Delete Organization"
        message={`Delete "${deleteOrg?.name}"?\n\nThis will permanently remove the organization and all its members. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isSubmitting={deleteMutation.isPending}
      />
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
    if (!name.trim()) return
    onSubmit({ name: name.trim(), slug: slug.trim() || undefined, description: description.trim() || undefined })
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Organization">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Organization Name *</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" required />
          </div>
          <div className="form-group">
            <label className="form-label">Slug</label>
            <input className="form-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated if empty" />
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>URL-friendly identifier. Auto-generated from name if left empty.</p>
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
    if (!name.trim()) return
    onSubmit({ name: name.trim(), slug: slug.trim() || undefined, description: description.trim() || undefined })
  }

  return (
    <Modal open onClose={onClose} title="Edit Organization">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Name *</label>
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
