import { useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCan } from '../contexts/OrgPermissionsContext'
import { Modal, SelectField } from '../components/Modal'
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  publishResource,
  archiveResource,
  downloadResource,
  type Resource,
  type ResourceCreate,
  type ResourceUpdate,
} from '../api/resources'

export function ResourcesPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const queryClient = useQueryClient()
  const can = useCan()

  const [uploadOpen, setUploadOpen] = useState(false)
  const [editResource, setEditResource] = useState<Resource | null>(null)

  const orgIdNum = parseInt(orgId ?? '0', 10)

  const {
    data: resources = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['resources', orgIdNum],
    queryFn: () => getResources(orgIdNum),
    enabled: !!orgId,
  })

  const createMutation = useMutation({
    mutationFn: (data: ResourceCreate) => createResource(orgIdNum, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', orgIdNum] })
      setUploadOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ResourceUpdate }) =>
      updateResource(orgIdNum, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', orgIdNum] })
      setEditResource(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteResource(orgIdNum, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', orgIdNum] })
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id: number) => publishResource(orgIdNum, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', orgIdNum] })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: number) => archiveResource(orgIdNum, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', orgIdNum] })
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
            {resources.length} resource{resources.length !== 1 ? 's' : ''}
          </p>
        </div>
        {can('resource.create') && (
          <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
            + Upload Resource
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card"><div className="card-body"><p style={{ color: 'var(--gray-500)' }}>Loading...</p></div></div>
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
                      {r.description || '—'}
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
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => downloadResource(r.id)} title="Download">
                          Download
                        </button>
                        {can('resource.update') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditResource(r)}>
                            Edit
                          </button>
                        )}
                        {r.visibility === 'PRIVATE' && can('resource.publish') && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--success)' }}
                            onClick={() => publishMutation.mutate(r.id)}
                            disabled={publishMutation.isPending}
                          >
                            Publish
                          </button>
                        )}
                        {r.visibility === 'PUBLIC' && can('resource.archive') && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--warning)' }}
                            onClick={() => archiveMutation.mutate(r.id)}
                            disabled={archiveMutation.isPending}
                          >
                            Archive
                          </button>
                        )}
                        {can('resource.delete') && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (confirm(`Delete "${r.title}"?\n\nThis action cannot be undone.`))
                                deleteMutation.mutate(r.id)
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UploadResourceModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
        error={createMutation.error?.message}
      />

      {editResource && (
        <EditResourceModal
          resource={editResource}
          onClose={() => setEditResource(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editResource.id, data })}
          isSubmitting={updateMutation.isPending}
          error={updateMutation.error?.message}
        />
      )}
    </div>
  )
}

function UploadResourceModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: ResourceCreate) => void
  isSubmitting: boolean
  error?: string
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [storageKey, setStorageKey] = useState('')
  const [visibility, setVisibility] = useState<string>('PRIVATE')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      storage_key: storageKey.trim(),
      visibility: visibility as 'PUBLIC' | 'PRIVATE',
    })
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
            <label className="form-label">Storage Key</label>
            <input className="form-input" value={storageKey} onChange={(e) => setStorageKey(e.target.value)} placeholder="e.g. uploads/file.pdf" />
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Unique file path or identifier for storage.</p>
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
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
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
