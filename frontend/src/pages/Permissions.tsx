import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCan } from '../contexts/OrgPermissionsContext'
import { getRoles, type Role } from '../api/roles'
import {
  getRolePermissions,
  updateRolePermissions,
  type PermissionOverrideResponse,
  type PermissionOverride,
} from '../api/permissions'

const PERMISSION_GROUPS: Record<string, { key: string; label: string }[]> = {
  Members: [
    { key: 'membership.read', label: 'View members' },
    { key: 'membership.create', label: 'Add members' },
    { key: 'membership.update', label: 'Edit members' },
    { key: 'membership.delete', label: 'Remove members' },
  ],
  Resources: [
    { key: 'resource.read', label: 'View resources' },
    { key: 'resource.create', label: 'Create resources' },
    { key: 'resource.update', label: 'Update resources' },
    { key: 'resource.delete', label: 'Delete resources' },
  ],
  Administration: [
    { key: 'permission.manage', label: 'Manage permissions' },
    { key: 'audit.read', label: 'View audit logs' },
  ],
}

export function PermissionsPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const queryClient = useQueryClient()
  const can = useCan()

  const orgIdNum = parseInt(orgId ?? '0', 10)

  const { data: roles = [], isError: rolesError, error: rolesErr } = useQuery({
    queryKey: ['roles', orgIdNum],
    queryFn: () => getRoles(orgIdNum),
    enabled: !!orgId,
  })

  const editorRole = roles.find((r) => r.name === 'Editor')

  if (!orgId) return <div>Invalid organization</div>

  if (rolesError) {
    const statusCode = (rolesErr as any)?.response?.status
    if (statusCode === 404) {
      return (
        <div className="state-message">
          <h3>Access Denied</h3>
          <p>You no longer have access to this organization's permissions.</p>
          <Link to={`/organizations/${orgId}`} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
            Back to Organization
          </Link>
        </div>
      )
    }
    return <div className="state-message"><h3>Error</h3><p>Could not load roles.</p></div>
  }

  if (!can('permission.manage')) {
    return <div className="state-message"><h3>Access Denied</h3><p>You do not have permission to manage permissions.</p></div>
  }

  if (!editorRole) {
    return <div className="state-message"><h3>Editor role not found</h3></div>
  }

  return <PermissionEditor orgId={orgIdNum} role={editorRole} queryClient={queryClient} />
}

function PermissionEditor({
  orgId,
  role,
  queryClient,
}: {
  orgId: number
  role: Role
  queryClient: ReturnType<typeof useQueryClient>
}) {
  const { data: currentPerms = [], isLoading } = useQuery({
    queryKey: ['rolePermissions', orgId, role.id],
    queryFn: () => getRolePermissions(orgId, role.id),
  })

  const [pending, setPending] = useState<Map<string, boolean>>(new Map())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (currentPerms.length > 0) {
      setPending(new Map(currentPerms.map((p) => [p.permission_name, p.allowed])))
      setSaved(false)
    }
  }, [currentPerms])

  const mutation = useMutation({
    mutationFn: (data: PermissionOverride[]) => updateRolePermissions(orgId, role.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', orgId, role.id] })
      queryClient.invalidateQueries({ queryKey: ['orgPermissions', orgId] })
      setSaved(true)
    },
  })

  const toggle = (name: string) => {
    setPending((prev) => {
      const next = new Map(prev)
      next.set(name, !(next.get(name) ?? false))
      return next
    })
    setSaved(false)
  }

  const buildPayload = (): PermissionOverride[] => {
    const permissionMap = new Map(currentPerms.map((p) => [p.permission_name, p.permission_id]))
    return Array.from(pending.entries()).map(([name, allowed]) => ({
      permission_id: permissionMap.get(name) ?? 0,
      allowed,
    }))
  }

  if (isLoading) {
    return <div className="state-message"><h3>Loading...</h3><p>Loading permissions for {role.name}</p></div>
  }

  const hasChanges =
    currentPerms.length > 0 &&
    currentPerms.some((p) => pending.get(p.permission_name) !== p.allowed)

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Permissions</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
            Editing permissions for <strong>{role.name}</strong>
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!hasChanges || mutation.isPending}
          onClick={() => mutation.mutate(buildPayload())}
        >
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saved && (
        <div
          style={{
            padding: '10px 16px',
            background: '#dcfce7',
            color: '#166534',
            borderRadius: 6,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          Permissions saved successfully. Local cache has been refreshed.
        </div>
      )}

      {currentPerms.length === 0 && (
        <div className="card">
          <div className="card-body">
            <p style={{ color: 'var(--gray-500)' }}>
              No permissions defined. Defaults will be empty for this role.
            </p>
          </div>
        </div>
      )}

      {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
        <div className="card" key={group} style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h2>{group}</h2>
          </div>
          <div className="card-body" style={{ padding: '8px 0' }}>
            {perms.map((perm) => {
              const effective = pending.get(perm.key)
              if (effective === undefined) return null

              const defaultPerm = currentPerms.find(
                (p) => p.permission_name === perm.key && p.source === 'default'
              )
              const source = defaultPerm ? 'default' : 'override'
              const changed =
                currentPerms.find((p) => p.permission_name === perm.key)?.allowed !== effective

              return (
                <label
                  key={perm.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 24px',
                    cursor: 'pointer',
                    transition: 'background var(--transition)',
                    background: changed ? '#fffbeb' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={effective}
                    onChange={() => toggle(perm.key)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{perm.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--gray-400)', marginLeft: 8 }}>
                      <code>{perm.key}</code>
                    </span>
                  </div>
                  <span
                    className={`badge badge-${source === 'default' ? 'info' : 'warning'}`}
                    style={{ fontSize: 11 }}
                  >
                    {source}
                  </span>
                  {changed && (
                    <span
                      className="badge badge-warning"
                      style={{ fontSize: 11 }}
                    >
                      unsaved
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
