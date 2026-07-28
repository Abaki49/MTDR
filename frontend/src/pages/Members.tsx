import { useState, type FormEvent, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCan } from '../contexts/OrgPermissionsContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Modal, SelectField } from '../components/Modal'
import { ConfirmModal } from '../components/ConfirmModal'
import { TableSkeleton } from '../components/Skeleton'
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  type Member,
  type MemberCreate,
  type MemberUpdate,
} from '../api/memberships'
import { createAdminUser, type CreateAdminUserRequest } from '../api/admin'
import { getRoles } from '../api/roles'
import { searchUsers, type UserSearchResult } from '../api/users'

export function MembersPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const queryClient = useQueryClient()
  const can = useCan()
  const { user } = useAuth()
  const { toast } = useToast()

  const [addOpen, setAddOpen] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null)

  const orgIdNum = parseInt(orgId ?? '0', 10)

  const [page, setPage] = useState(0)
  const pageSize = 50

  const {
    data: membersData = { items: [], total: 0 },
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['members', orgIdNum, page, pageSize],
    queryFn: () => getMembers(orgIdNum, pageSize, page * pageSize),
    enabled: !!orgId,
  })

  const members = membersData.items
  const totalPages = Math.ceil(membersData.total / pageSize) || 1

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', orgIdNum],
    queryFn: () => getRoles(orgIdNum),
    enabled: !!orgId,
  })

  const createMutation = useMutation({
    mutationFn: (data: MemberCreate) => createMember(orgIdNum, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgIdNum] })
      queryClient.invalidateQueries({ queryKey: ['orgPermissions', orgIdNum] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemberUpdate }) =>
      updateMember(orgIdNum, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgIdNum] })
      queryClient.invalidateQueries({ queryKey: ['orgPermissions', orgIdNum] })
      setEditMember(null)
      toast('Member updated successfully', 'success')
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.detail || 'Failed to update member'
      toast(msg, 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMember(orgIdNum, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgIdNum] })
      queryClient.invalidateQueries({ queryKey: ['orgPermissions', orgIdNum] })
      setDeleteTarget(null)
      toast('Member removed successfully', 'success')
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.detail || 'Failed to remove member'
      toast(msg, 'error')
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
    return (
      <div>
        <div className="toolbar"><h1 style={{ fontSize: 20, margin: 0 }}>Members</h1></div>
        <TableSkeleton rows={4} cols={6} />
      </div>
    )
  }

  if (isError) {
    const statusCode = (error as any)?.response?.status
    if (statusCode === 404) {
      return (
        <div className="state-message">
          <h3>Access Denied</h3>
          <p>You no longer have access to this organization's members.</p>
          <Link to={`/organizations/${orgId}`} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
            Back to Organization
          </Link>
        </div>
      )
    }
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
                    <td>{m.user_email || '\u2014'}</td>
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
                            onClick={() => setDeleteTarget(m)}
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
        roles={roles}
        onSubmit={(data) => createMutation.mutateAsync(data)}
        isSubmitting={createMutation.isPending}
        callerIsSuperAdmin={user?.is_super_admin ?? false}
        orgIdNum={orgIdNum}
      />

      {editMember && (
        <EditMemberModal
          member={editMember}
          onClose={() => setEditMember(null)}
          roleOptions={assignableRoleOptions.length > 0 ? assignableRoleOptions : roleOptions}
          statusOptions={statusOptions}
          onSubmit={(data) => updateMutation.mutate({ id: editMember.id, data })}
          isSubmitting={updateMutation.isPending}
          error={(updateMutation.error as Error)?.message}
        />
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Remove Member"
        message={`Remove ${deleteTarget?.user_name || `user #${deleteTarget?.user_id}`} from this organization?\n\nThey will lose access to all resources in this organization.`}
        confirmLabel="Remove"
        destructive
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  )
}

type MemberModalMode = 'search' | 'create' | 'created'

function AddMemberModal({
  open,
  onClose,
  roleOptions,
  canAssign,
  roles,
  onSubmit,
  isSubmitting,
  error,
  callerIsSuperAdmin,
  orgIdNum,
}: {
  open: boolean
  onClose: () => void
  roleOptions: { value: number; label: string }[]
  canAssign: boolean
  roles: { id: number; name: string; rank: number; caller_can_assign: boolean }[]
  onSubmit: (data: MemberCreate) => Promise<Member>
  isSubmitting: boolean
  callerIsSuperAdmin: boolean
  orgIdNum: number
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState<MemberModalMode>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [selected, setSelected] = useState<UserSearchResult | null>(null)
  const [roleId, setRoleId] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localSubmitting, setLocalSubmitting] = useState(false)
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setMode('search')
      setQuery('')
      setSelected(null)
      setRoleId('')
      setStatus('ACTIVE')
      setName('')
      setEmail('')
      setIsSuperAdmin(false)
      setCreatedPassword(null)
      setLocalError(null)
      setLocalSubmitting(false)
      setResults([])
      setShowDropdown(false)
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selected) {
      setQuery(selected.name)
      setShowDropdown(false)
    }
  }, [selected])

  const handleSearch = (value: string) => {
    setQuery(value)
    setSelected(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setResults([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await searchUsers(value)
        setResults(data)
        setShowDropdown(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 250)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (mode === 'search') {
      if (!selected) return
      setLocalSubmitting(true)
      try {
        const result = await onSubmit({
          user_id: selected.id,
          role_id: parseInt(roleId, 10),
          status,
        })
        if (result.generated_password) {
          setCreatedPassword(result.generated_password)
          setMode('created')
        } else {
          toast('Member added successfully', 'success')
          onClose()
        }
      } catch (err: unknown) {
        const msg = (err as any)?.response?.data?.detail || 'Failed to add member'
        setLocalError(msg)
      } finally {
        setLocalSubmitting(false)
      }
      return
    }

    if (mode === 'create') {
      setLocalSubmitting(true)
      try {
        if (isSuperAdmin && callerIsSuperAdmin) {
          const adminResult = await createAdminUser({
            name,
            email,
            is_super_admin: true,
          })
          if (adminResult.generated_password) {
            setCreatedPassword(adminResult.generated_password)
            setMode('created')
          } else {
            toast('Super admin created successfully', 'success')
            onClose()
          }
        } else {
          const result = await onSubmit({
            name,
            email,
            role_id: parseInt(roleId, 10),
            status,
          })
          if (result.generated_password) {
            setCreatedPassword(result.generated_password)
            setMode('created')
          } else {
            toast('Member added successfully', 'success')
            onClose()
          }
        }
      } catch (err: unknown) {
        const msg = (err as any)?.response?.data?.detail || 'Failed to create member'
        setLocalError(msg)
      } finally {
        setLocalSubmitting(false)
      }
    }
  }

  const handleCopyPassword = () => {
    if (createdPassword && passwordRef.current) {
      navigator.clipboard?.writeText(createdPassword)
      toast('Password copied to clipboard', 'success')
    }
  }

  const handleDone = () => {
    if (createdPassword) {
      queryClient.invalidateQueries({ queryKey: ['members', orgIdNum] })
      queryClient.invalidateQueries({ queryKey: ['orgPermissions', orgIdNum] })
    }
    onClose()
  }

  if (mode === 'created') {
    return (
      <Modal open={open} onClose={handleDone} title="User Created">
        <div className="modal-body">
          <p style={{ marginBottom: 16 }}>
            The user has been created successfully.
            {createdPassword ? ' A password has been generated.' : ''}
          </p>
          {createdPassword && (
            <div className="form-group">
              <label className="form-label">Generated Password</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  ref={passwordRef}
                  className="form-input"
                  type="text"
                  value={createdPassword}
                  readOnly
                  style={{ fontFamily: 'monospace', flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCopyPassword}
                >
                  Copy
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                Copy this password now. It will not be shown again.
              </p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={handleDone}>
            Done
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Member">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'search' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => { setMode('search'); setLocalError(null) }}
              >
                Search existing
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'create' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => { setMode('create'); setLocalError(null) }}
              >
                Create new
              </button>
            </div>
          </div>

          {mode === 'search' ? (
            <>
              <div className="form-group">
                <label className="form-label">User</label>
                {selected ? (
                  <div className="selected-user-badge">
                    <span><strong>{selected.name}</strong> &lt;{selected.email}&gt;</span>
                    <button type="button" className="remove-btn" onClick={() => { setSelected(null); setQuery(''); inputRef.current?.focus() }} title="Change user">
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="search-input-wrapper" ref={wrapperRef}>
                    <input
                      ref={inputRef}
                      className="form-input"
                      type="text"
                      value={query}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      autoFocus
                    />
                    {showDropdown && (
                      <div className="search-results-dropdown">
                        {searching ? (
                          <div className="search-no-results">Searching...</div>
                        ) : results.length === 0 && query.trim() ? (
                          <div className="search-no-results">No users found</div>
                        ) : (
                          results.map((u) => (
                            <div
                              key={u.id}
                              className="search-result-item"
                              onClick={() => setSelected(u)}
                            >
                              <div>
                                <div className="name">{u.name}</div>
                                <div className="email">{u.email}</div>
                              </div>
                              {u.is_super_admin && (
                                <span className="badge badge-info" style={{ fontSize: 11 }}>Admin</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
                <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                  Search for a user by name or email address.
                </p>
              </div>
            </>
          ) : (
            <>
              {callerIsSuperAdmin && (
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={isSuperAdmin}
                      onChange={(e) => setIsSuperAdmin(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    Super Admin (full access to all organizations)
                  </label>
                </div>
              )}
              {!isSuperAdmin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      className="form-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
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
                  <SelectField
                    label="Status"
                    name="status"
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'SUSPENDED', label: 'Suspended' },
                      { value: 'INVITED', label: 'Invited' },
                    ]}
                  />
                </div>
              )}
              {isSuperAdmin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      className="form-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                    />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                    Super admins have full access to all organizations. No membership will be created.
                  </p>
                </div>
              )}
            </>
          )}

          {mode === 'create' && !isSuperAdmin && !canAssign && (
            <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>
              You cannot assign any role from your current rank.
            </p>
          )}
          {localError && <p className="form-error">{localError}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              localSubmitting ||
              (mode === 'search' && !selected) ||
              (mode === 'create' && !isSuperAdmin && (!name || !email || !roleId)) ||
              (mode === 'create' && isSuperAdmin && (!name || !email))
            }
          >
            {localSubmitting ? 'Adding...' : mode === 'create' && isSuperAdmin ? 'Create Super Admin' : 'Add Member'}
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
            <label className="form-label">Member</label>
            <input className="form-input" type="text" value={`${member.user_name || ''} (ID: ${member.user_id})`} disabled />
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
