import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCan } from '../contexts/OrgPermissionsContext'
import { Modal, SelectField } from '../components/Modal'
import {
  getMembers,
  createMember,
  updateMember,
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

  if (!orgId) return <div>Invalid organization</div>

  const roleOptions = roles.map((r) => ({
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
                <th>User ID</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 500 }}>{m.id}</td>
                    <td>{m.user_id}</td>
                    <td>{roles.find((r) => r.id === m.role_id)?.name ?? m.role_id}</td>
                    <td>
                      <span className={`badge badge-${badgeVariant(m.status)}`}>{m.status}</span>
                    </td>
                    <td>
                      {can('membership.update') && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditMember(m)}>
                          Edit
                        </button>
                      )}
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
        roleOptions={roleOptions}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
        error={createMutation.error?.message}
      />

      {editMember && (
        <EditMemberModal
          member={editMember}
          onClose={() => setEditMember(null)}
          roleOptions={roleOptions}
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
  onSubmit,
  isSubmitting,
  error,
}: {
  open: boolean
  onClose: () => void
  roleOptions: { value: number; label: string }[]
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
          </div>
          <SelectField
            label="Role"
            name="role_id"
            value={roleId}
            onChange={setRoleId}
            options={roleOptions}
            required
          />
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
  statusOptions,
  onSubmit,
  isSubmitting,
  error,
}: {
  member: Member
  onClose: () => void
  roleOptions: { value: number; label: string }[]
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
            <label className="form-label">User ID</label>
            <input className="form-input" type="text" value={member.user_id} disabled />
          </div>
          <SelectField
            label="Role"
            name="role_id"
            value={roleId}
            onChange={setRoleId}
            options={roleOptions}
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
