import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCan } from '../contexts/OrgPermissionsContext'
import { Modal, SelectField } from '../components/Modal'
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  type Member,
  type MemberCreate,
  type MemberUpdate,
} from '../api/memberships'
import { getRoles } from '../api/roles'

export function MembersPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const queryClient = useQueryClient()
  const can = useCan()

  const [addOpen, setAddOpen] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)

  const orgIdNum = parseInt(orgId ?? '0', 10)

  const { data: members = [], isLoading, isError } = useQuery({
    queryKey: ['members', orgIdNum],
    queryFn: () => getMembers(orgIdNum),
    enabled: !!orgId,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', orgIdNum],
    queryFn: () => getRoles(orgIdNum),
    enabled: !!orgId,
  })

  const createMutation = useMutation({
    mutationFn: (data: MemberCreate) => createMember(orgIdNum, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgIdNum] })
      setAddOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemberUpdate }) =>
      updateMember(orgIdNum, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgIdNum] })
      setEditMember(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMember(orgIdNum, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgIdNum] })
    },
  })

  if (!orgId) return <div>Invalid organization</div>

  const assignableRoles = roles.filter((r) => r.caller_can_assign)
  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: `${r.name} (rank ${r.rank})`,
  }))
  const assignableRoleOptions = assignableRoles.map((r) => ({
    value: r.id,
    label: `${r.name} (rank ${r.rank})`,
  }))

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'INVITED', label: 'Invited' },
  ]

  const badgeVariant = (status: string) => {
    if (status === 'ACTIVE') return 'success'
    if (status === 'SUSPENDED') return 'danger'
    return 'neutral'
  }

  if (isLoading) {
    return <div className="state-message"><h3>Loading...</h3><p>Fetching members</p></div>
  }

  if (isError) {
    return <div className="state-message"><h3>Error</h3><p>Could not load members.</p></div>
  }

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Members</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        {can('membership.create') && (
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            + Add Member
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 500 }}>{m.id}</td>
                    <td>{m.user_name || `User #${m.user_id}`}</td>
                    <td>{m.user_email || '—'}</td>
                    <td>{roles.find((r) => r.id === m.role_id)?.name ?? m.role_id}</td>
                    <td>
                      <span className={`badge badge-${badgeVariant(m.status)}`}>{m.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {can('membership.update') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditMember(m)}>
                            Edit
                          </button>
                        )}
                        {can('membership.delete') && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (confirm(`Remove ${m.user_name || `user #${m.user_id}`} from this organization?`))
                                deleteMutation.mutate(m.id)
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddMemberModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        roleOptions={assignableRoleOptions.length > 0 ? assignableRoleOptions : roleOptions}
        canAssign={assignableRoles.length > 0}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
        error={createMutation.error?.message}
      />

      {editMember && (
        <EditMemberModal
          member={editMember}
          onClose={() => setEditMember(null)}
          roleOptions={roleOptions}
          assignableRoleOptions={assignableRoleOptions}
          statusOptions={statusOptions}
          onSubmit={(data) => updateMutation.mutate({ id: editMember.id, data })}
          isSubmitting={updateMutation.isPending}
          error={updateMutation.error?.message}
        />
      )}
    </div>
  )
}

function AddMemberModal({
  open,
  onClose,
  roleOptions,
  canAssign,
  onSubmit,
  isSubmitting,
  error,
}: {
  open: boolean
  onClose: () => void
  roleOptions: { value: number; label: string }[]
  canAssign: boolean
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
    <Modal open={open} onClose={onClose} title="Add Member">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">User ID</label>
            <input
              className="form-input"
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              required
              min={1}
            />
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
              Enter the numeric user ID. Only roles with rank above yours are available.
            </p>
          </div>
          <SelectField
            label="Role"
            name="role_id"
            value={roleId}
            onChange={setRoleId}
            options={roleOptions}
            required
          />
          {!canAssign && (
            <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>
              You cannot assign any role from your current rank.
            </p>
          )}
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EditMemberModal({
  member,
  onClose,
  roleOptions,
  assignableRoleOptions,
  statusOptions,
  onSubmit,
  isSubmitting,
  error,
}: {
  member: Member
  onClose: () => void
  roleOptions: { value: number; label: string }[]
  assignableRoleOptions: { value: number; label: string }[]
  statusOptions: { value: string; label: string }[]
  onSubmit: (data: MemberUpdate) => void
  isSubmitting: boolean
  error?: string
}) {
  const [roleId, setRoleId] = useState(String(member.role_id))
  const [status, setStatus] = useState(member.status)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ role_id: parseInt(roleId, 10), status })
  }

  return (
    <Modal open onClose={onClose} title="Edit Member">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Member</label>
            <input className="form-input" type="text" value={`${member.user_name || ''} (ID: ${member.user_id})`} disabled />
          </div>
          <SelectField
            label="Role"
            name="role_id"
            value={roleId}
            onChange={setRoleId}
            options={assignableRoleOptions.length > 0 && !roleOptions.find((r) => r.value === parseInt(roleId, 10) && !r.value) ? assignableRoleOptions : roleOptions}
          />
          <SelectField
            label="Status"
            name="status"
            value={status}
            onChange={setStatus}
            options={statusOptions}
          />
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
