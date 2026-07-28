import { useState, type FormEvent, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCan } from '../contexts/OrgPermissionsContext'
import { useToast } from '../contexts/ToastContext'
import { Modal, SelectField } from '../components/Modal'
import { ConfirmModal } from '../components/ConfirmModal'
import { TableSkeleton } from '../components/Skeleton'
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  publishResource,
  archiveResource,
  downloadResource,
  type Resource,
  type ResourceUpdate,
} from '../api/resources'

export function ResourcesPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const queryClient = useQueryClient()
  const can = useCan()
  const { toast } = useToast()

  const [uploadOpen, setUploadOpen] = useState(false)
  const [editResource, setEditResource] = useState<Resource | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null)
  const [page, setPage] = useState(0)
  const pageSize = 50

  const orgIdNum = parseInt(orgId ?? '0', 10)

  const {
    data: resourcesData = { items: [], total: 0 },
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['resources', orgIdNum, page, pageSize],
    queryFn: () => getResources(orgIdNum, pageSize, page * pageSize),
    enabled: !!orgId,
  })

  const resources = resourcesData.items
  const totalPages = Math.ceil(resourcesData.total / pageSize) || 1

  const createMutation = useMutation({
    mutationFn: ({ file, title, description, visibility }: { file: File; title: string; description?: string; visibility?: 'PUBLIC' | 'PRIVATE' }) =>
      createResource(orgIdNum, file, title, description, visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', orgIdNum] })
      setUploadOpen(false)
      toast('Resource created successfully', 'success')
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.detail || 'Failed to create resource'
      toast(msg, 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ResourceUpdate }) =>
      updateResource(orgIdNum, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', orgIdNum] })
      setEditResource(null)
      toast('Resource updated successfully', 'success')
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.detail || 'Failed to update resource'
      toast(msg, 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteResource(orgIdNum, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', orgIdNum] })
      setDeleteTarget(null)
      toast('Resource deleted successfully', 'success')
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.detail || 'Failed to delete resource'
      toast(msg, 'error')
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id: number) => publishResource(orgIdNum, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', orgIdNum] })
      toast('Resource published successfully', 'success')
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.detail || 'Failed to publish resource'
      toast(msg, 'error')
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: number) => archiveResource(orgIdNum, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', orgIdNum] })
      toast('Resource archived successfully', 'success')
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.detail || 'Failed to archive resource'
      toast(msg, 'error')
    },
  })

  if (!orgId) return <div>Invalid organization</div>

  if (isError) {
    const statusCode = (error as any)?.response?.status
    if (statusCode === 404) {
      return (
        <div className="state-message">
          <h3>Access Denied</h3>
          <p>You don't have access to this organization or it doesn't exist.</p>
          <Link to="/organizations" className="btn btn-primary">Back to Organizations</Link>
        </div>
      )
    }
    return <div className="state-message"><h3>Error</h3><p>Could not load resources.</p></div>
  }

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Resources</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
            {resourcesData.total} resource{resourcesData.total !== 1 ? 's' : ''}
          </p>
        </div>
        {can('resource.create') && (
          <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
            + Upload Resource
          </button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : resources.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ color: 'var(--gray-500)', marginBottom: 8 }}>No resources yet.</p>
            {can('resource.create') && (
              <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>Upload your first resource</button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Visibility</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500, color: 'var(--gray-500)' }}>{r.id}</td>
                    <td><strong>{r.title}</strong></td>
                    <td style={{ color: r.description ? 'inherit' : 'var(--gray-400)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.description || '\u2014'}
                    </td>
                    <td>
                      <span className={`badge badge-${r.visibility === 'PUBLIC' ? 'success' : 'neutral'}`}>
                        {r.visibility}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <ActionsDropdown
                        resource={r}
                        canUpdate={can('resource.update')}
                        canDelete={can('resource.delete')}
                        canPublish={can('resource.publish')}
                        canArchive={can('resource.archive')}
                        onEdit={setEditResource}
                        onDelete={setDeleteTarget}
                        onPublish={(id) => publishMutation.mutate(id)}
                        onArchive={(id) => archiveMutation.mutate(id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '12px 0', borderTop: '1px solid var(--gray-100)' }}>
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
        </div>
      )}

      <UploadResourceModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={(file, title, description, visibility) => createMutation.mutate({ file, title, description, visibility })}
      />

      {editResource && (
        <EditResourceModal
          resource={editResource}
          onClose={() => setEditResource(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editResource.id, data })}
          isSubmitting={updateMutation.isPending}
          error={(updateMutation.error as Error)?.message}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Resource"
        message={`Delete "${deleteTarget?.title}"?\n\nThis action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  )
}

function ActionsDropdown({
  resource,
  canUpdate,
  canDelete,
  canPublish,
  canArchive,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
}: {
  resource: Resource
  canUpdate: boolean
  canDelete: boolean
  canPublish: boolean
  canArchive: boolean
  onEdit: (r: Resource) => void
  onDelete: (r: Resource) => void
  onPublish: (id: number) => void
  onArchive: (id: number) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasItems = canUpdate || canDelete || canPublish || canArchive

  if (!hasItems) return null

  return (
    <div className="actions-dropdown-wrapper" ref={ref}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(!open)}>
        Actions &darr;
      </button>
      {open && (
        <div className="actions-menu">
          <button
            className="actions-menu-item"
            onClick={() => { downloadResource(resource.id); setOpen(false) }}
          >
            Download
          </button>
          {canUpdate && (
            <button
              className="actions-menu-item"
              onClick={() => { onEdit(resource); setOpen(false) }}
            >
              Edit
            </button>
          )}
          {resource.visibility === 'PRIVATE' && canPublish && (
            <button
              className="actions-menu-item"
              onClick={() => { onPublish(resource.id); setOpen(false) }}
            >
              Publish
            </button>
          )}
          {resource.visibility !== 'PRIVATE' && canArchive && (
            <button
              className="actions-menu-item"
              onClick={() => { onArchive(resource.id); setOpen(false) }}
            >
              Archive
            </button>
          )}
          {canDelete && (
            <button
              className="actions-menu-item danger"
              onClick={() => { onDelete(resource); setOpen(false) }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function UploadResourceModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (file: File, title: string, description?: string, visibility?: 'PUBLIC' | 'PRIVATE') => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<string>('PRIVATE')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!open) {
      setTitle('')
      setDescription('')
      setFile(null)
      setVisibility('PRIVATE')
    }
  }, [open])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !file) return
    onSubmit(file, title.trim(), description.trim() || undefined, visibility as 'PUBLIC' | 'PRIVATE')
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload Resource">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resource title" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">File</label>
            <input
              type="file"
              className="form-input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          <SelectField
            label="Visibility"
            name="visibility"
            value={visibility}
            onChange={setVisibility}
            options={[
              { value: 'PRIVATE', label: 'Private (org members only)' },
              { value: 'PUBLIC', label: 'Public (anyone can view)' },
            ]}
          />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!file}>
            Upload
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EditResourceModal({
  resource,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  resource: Resource
  onClose: () => void
  onSubmit: (data: ResourceUpdate) => void
  isSubmitting: boolean
  error?: string
}) {
  const [title, setTitle] = useState(resource.title)
  const [description, setDescription] = useState(resource.description ?? '')
  const [storageKey, setStorageKey] = useState(resource.storage_key)
  const [visibility, setVisibility] = useState<string>(resource.visibility)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      storage_key: storageKey.trim(),
      visibility: visibility as 'PUBLIC' | 'PRIVATE',
    })
  }

  return (
    <Modal open onClose={onClose} title="Edit Resource">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Storage Key</label>
            <input className="form-input" value={storageKey} onChange={(e) => setStorageKey(e.target.value)} />
          </div>
          <SelectField
            label="Visibility"
            name="visibility"
            value={visibility}
            onChange={setVisibility}
            options={[
              { value: 'PRIVATE', label: 'Private' },
              { value: 'PUBLIC', label: 'Public' },
            ]}
          />
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
