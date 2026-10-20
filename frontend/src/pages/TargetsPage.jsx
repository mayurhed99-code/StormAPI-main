import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Target, Plus, Trash2, PlayCircle, Globe } from 'lucide-react'
import { AppLayout, PageWrapper, PageHeader } from '../components/Layout.jsx'
import { Card, Button, Input, Select, Alert, EmptyState } from '../components/ui.jsx'
import { targetsApi } from '../api/client.js'
import { toast } from '../components/toastApi.js'

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

function MethodBadge({ method }) {
  const colors = {
    GET:    '#22c55e', POST: '#3b82f6', PUT:   '#f59e0b',
    DELETE: '#ef4444', PATCH: '#a855f7',
  }
  return (
    <span style={{
      display: 'inline-block',
      background: `${colors[method] || '#8b98a5'}22`,
      color: colors[method] || '#8b98a5',
      border: `1px solid ${colors[method] || '#8b98a5'}44`,
      borderRadius: '4px',
      padding: '2px 7px',
      fontSize: '11px',
      fontWeight: 700,
      fontFamily: 'var(--mono)',
    }}>{method}</span>
  )
}

export default function TargetsPage() {
  const navigate = useNavigate()
  const [targets, setTargets]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [creating, setCreating]     = useState(false)
  const [formError, setFormError]   = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { method: 'GET' }
  })

  const load = () => {
    targetsApi.list()
      .then((r) => setTargets(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const onCreate = async (data) => {
    setFormError('')
    setCreating(true)
    try {
      await targetsApi.create({
        name: data.name,
        baseUrl: data.baseUrl,
        method: data.method,
        headersJson: data.headersJson || null,
        bodyTemplate: data.bodyTemplate || null,
      })
      toast('Target created', 'success')
      reset()
      setShowForm(false)
      load()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create target')
    } finally {
      setCreating(false)
    }
  }

  const onDelete = async (id) => {
    setDeletingId(id)
    try {
      await targetsApi.delete(id)
      toast('Target deleted', 'success')
      setTargets((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AppLayout>
      <PageWrapper>
        <PageHeader
          title="API Targets"
          subtitle="Register the HTTP endpoints you want to load test"
          action={
            <Button onClick={() => setShowForm(!showForm)} size="md">
              <Plus size={14} />
              New Target
            </Button>
          }
        />

        {/* Create form */}
        {showForm && (
          <Card style={{ padding: '20px', marginBottom: '20px' }} className="animate-fade-in">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>New API Target</h3>
            <form onSubmit={handleSubmit(onCreate)}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <Input
                  id="name"
                  label="Name"
                  placeholder="My API endpoint"
                  register={register('name', { required: 'Name is required' })}
                  error={errors.name?.message}
                />
                <Select
                  id="method"
                  label="HTTP Method"
                  register={register('method', { required: true })}
                  error={errors.method?.message}
                >
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <Input
                  id="baseUrl"
                  label="Target URL"
                  placeholder="https://api.example.com/endpoint"
                  register={register('baseUrl', {
                    required: 'URL is required',
                    pattern: { value: /^https?:\/\/.+/, message: 'Must start with http:// or https://' },
                  })}
                  error={errors.baseUrl?.message}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                    Headers (JSON, optional)
                  </label>
                  <textarea
                    placeholder='{"Content-Type": "application/json"}'
                    {...register('headersJson')}
                    rows={3}
                    style={{
                      width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: '6px', color: 'var(--text)', fontSize: '12px', padding: '7px 10px',
                      outline: 'none', fontFamily: 'var(--mono)', resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                    Body template (optional)
                  </label>
                  <textarea
                    placeholder='{"key": "value"}'
                    {...register('bodyTemplate')}
                    rows={3}
                    style={{
                      width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: '6px', color: 'var(--text)', fontSize: '12px', padding: '7px 10px',
                      outline: 'none', fontFamily: 'var(--mono)', resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              <Alert message={formError} />
              <div style={{ display: 'flex', gap: '8px', marginTop: formError ? '10px' : 0 }}>
                <Button type="submit" loading={creating}>Save Target</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setFormError(''); reset() }}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Targets table */}
        <Card style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-2)' }}>Loading…</div>
          ) : targets.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No targets registered"
              description="Add an API endpoint to start load testing"
              action={
                <Button onClick={() => setShowForm(true)}>
                  <Plus size={14} /> Add first target
                </Button>
              }
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'URL', 'Method', 'Created', 'Actions'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 14px',
                      fontSize: '11px', color: 'var(--text-2)',
                      fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {targets.map((t) => (
                  <tr key={t.id} style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 500, fontSize: '13px' }}>{t.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Globe size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-2)',
                          maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{t.baseUrl}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}><MethodBadge method={t.method} /></td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-2)' }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          size="sm"
                          onClick={() => navigate('/run', { state: { targetId: t.id } })}
                        >
                          <PlayCircle size={12} />
                          Run Test
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={deletingId === t.id}
                          onClick={() => onDelete(t.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </PageWrapper>
    </AppLayout>
  )
}
