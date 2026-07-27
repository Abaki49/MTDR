import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCan } from '../contexts/OrgPermissionsContext'
import { Modal, SelectField } from '../components/Modal'
import { getMembers, createMember, updateMember, type Member, type MemberCreate, type MemberUpdate } from '../api/memberships'
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
  if (isLoading) return <div>Loading members...</div>
  if (isError) return <div>Could not load members.</div>

  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: `${r.name} (rank ${r.rank})`,
  }))

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'INVITED', label: 'Invited' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Members</h1>
        {can('membership.create') && (
          <button onClick={() => setAddOpen(true)} style={{ padding: '8px 16px' }}>
            + Add Member
          </button>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>User ID</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={tdStyle}>{m.id}</td>
              <td style={tdStyle}>{m.user_id}</td>
              <td style={tdStyle}>{roles.find((r) => r.id === m.role_id)?.name ?? m.role_id}</td>
              <td style={tdStyle}>{m.status}</td>
              <td style={tdStyle}>
                {can('membership.update') && (
                  <button onClick={() => setEditMember(m)} style={{ padding: '4px 12px', fontSize: 13 }}>
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
          onSubmit={(data) =>
            updateMutation.mutate({ id: editMember.id, data })
          }
          isSubmitting={updateMutation.isPending}
          error={updateMutation.error?.message}
        />
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = { padding: '8px 12px', borderBottom: '2px solid #ddd' }
const tdStyle: React.CSSProperties = { padding: '8px 12px' }

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
        <div style={{ marginBottom: 12 }}>
          <label>User ID</label><br />
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            min={1}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
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
        {error && <p style={{ color: 'red', fontSize: 13 }}>{error}</p>}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px' }}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px' }}>
            {isSubmitting ? 'Adding...' : 'Add'}
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
    onSubmit({
      role_id: parseInt(roleId, 10),
      status,
    })
  }

  return (
    <Modal open onClose={onClose} title="Edit Member">
      <form onSubmit={handleSubmit}>
        <p style={{ color: '#666', fontSize: 14 }}>User ID: {member.user_id}</p>
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
        {error && <p style={{ color: 'red', fontSize: 13 }}>{error}</p>}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px' }}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px' }}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
