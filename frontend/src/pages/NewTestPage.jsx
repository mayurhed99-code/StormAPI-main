import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { PlayCircle, Zap, AlertCircle } from 'lucide-react'
import { AppLayout, PageWrapper, PageHeader } from '../components/Layout.jsx'
import { Card, Button, Input, Select, Alert } from '../components/ui.jsx'
import { targetsApi, configsApi, runsApi } from '../api/client.js'
import { setActiveRun } from '../store/runSlice.js'
import { toast } from '../components/toastApi.js'

const MAX = { concurrency: 250, totalRequests: 10000, timeoutMs: 30000 }

export default function NewTestPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError]     = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      targetId:      '',
      concurrency:   10,
      totalRequests: 100,
      timeoutMs:     5000,
    },
  })

  const concurrency    = watch('concurrency')
  const totalRequests  = watch('totalRequests')

  useEffect(() => {
    targetsApi.list()
      .then((r) => {
        setTargets(r.data)
        // Pre-select target if coming from Targets page
        const preId = location.state?.targetId
        if (preId && r.data.some((t) => t.id === preId)) {
          setValue('targetId', String(preId))
        } else if (r.data.length > 0) {
          setValue('targetId', String(r.data[0].id))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  const onSubmit = async (data) => {
    setError('')
    setRunning(true)
    try {
      // 1. Create config
      const configRes = await configsApi.create(Number(data.targetId), {
        concurrency:   Number(data.concurrency),
        totalRequests: Number(data.totalRequests),
        timeoutMs:     Number(data.timeoutMs),
      })
      const configId = configRes.data.id

      // 2. Start run
      const runRes = await runsApi.start(configId)
      const runId  = runRes.data.runId

      // 3. Store active run in Redux
      dispatch(setActiveRun(runId))
      toast('Test started — watching live metrics', 'success')

      // 4. Navigate to live dashboard
      navigate(`/live/${runId}`)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to start test'
      setError(msg)
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <PageWrapper>
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-2)' }}>Loading targets…</div>
        </PageWrapper>
      </AppLayout>
    )
  }

  if (targets.length === 0) {
    return (
      <AppLayout>
        <PageWrapper>
          <PageHeader title="New Test" subtitle="Configure and start a load test" />
          <Card style={{ padding: '32px', textAlign: 'center' }}>
            <AlertCircle size={32} style={{ color: 'var(--text-3)', marginBottom: '10px' }} />
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>No targets registered</p>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px' }}>
              You need to register at least one API target before starting a test.
            </p>
            <Button onClick={() => navigate('/targets')}>Register a Target</Button>
          </Card>
        </PageWrapper>
      </AppLayout>
    )
  }

  const selectedTarget = targets.find((t) => String(t.id) === String(watch('targetId')))

  return (
    <AppLayout>
      <PageWrapper>
        <PageHeader
          title="New Load Test"
          subtitle="Configure parameters and start a concurrent load test"
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          {/* Config form */}
          <Card style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <Select
                id="targetId"
                label="Target"
                register={register('targetId', { required: 'Select a target' })}
                error={errors.targetId?.message}
              >
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — {t.method} {t.baseUrl}</option>
                ))}
              </Select>

              {/* Concurrency slider + input */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Concurrency — simultaneous requests
                  <span className="metric" style={{ marginLeft: '8px', color: 'var(--accent)', fontSize: '14px' }}>
                    {concurrency}
                  </span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="range"
                    min="1" max={MAX.concurrency} step="1"
                    {...register('concurrency', { min: 1, max: MAX.concurrency })}
                    style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <input
                    type="number"
                    min="1" max={MAX.concurrency}
                    value={concurrency}
                    onChange={e => setValue('concurrency', Number(e.target.value))}
                    style={{
                      width: '70px', background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: '6px', color: 'var(--text)', fontSize: '13px', padding: '5px 8px',
                      fontFamily: 'var(--mono)', textAlign: 'right', outline: 'none',
                    }}
                  />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
                  Max {MAX.concurrency} concurrent requests enforced server-side
                </p>
              </div>

              {/* Total requests slider + input */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Total requests
                  <span className="metric" style={{ marginLeft: '8px', color: 'var(--accent)', fontSize: '14px' }}>
                    {Number(totalRequests).toLocaleString()}
                  </span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="range"
                    min="1" max={MAX.totalRequests} step="10"
                    {...register('totalRequests', { min: 1, max: MAX.totalRequests })}
                    style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <input
                    type="number"
                    min="1" max={MAX.totalRequests}
                    value={totalRequests}
                    onChange={e => setValue('totalRequests', Number(e.target.value))}
                    style={{
                      width: '80px', background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: '6px', color: 'var(--text)', fontSize: '13px', padding: '5px 8px',
                      fontFamily: 'var(--mono)', textAlign: 'right', outline: 'none',
                    }}
                  />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
                  Max {MAX.totalRequests.toLocaleString()} requests per run
                </p>
              </div>

              <Input
                id="timeoutMs"
                label="Per-request timeout (ms)"
                type="number"
                placeholder="5000"
                register={register('timeoutMs', {
                  required: true,
                  min: { value: 1, message: 'Min 1ms' },
                  max: { value: MAX.timeoutMs, message: `Max ${MAX.timeoutMs}ms` },
                })}
                error={errors.timeoutMs?.message}
              />

              <Alert message={error} />

              <Button type="submit" size="lg" fullWidth loading={running} disabled={running}>
                <Zap size={16} />
                {running ? 'Starting test…' : 'Start Load Test'}
              </Button>
            </form>
          </Card>

          {/* Preview panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedTarget && (
              <Card style={{ padding: '16px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Target
                </p>
                <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{selectedTarget.name}</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-2)', wordBreak: 'break-all' }}>
                  {selectedTarget.method} {selectedTarget.baseUrl}
                </p>
              </Card>
            )}

            <Card style={{ padding: '16px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Test parameters
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ParamRow label="Concurrency" value={`${concurrency} threads`} />
                <ParamRow label="Total requests" value={Number(totalRequests).toLocaleString()} />
                <ParamRow label="Timeout" value={`${watch('timeoutMs')} ms`} />
                <ParamRow
                  label="Est. duration"
                  value={
                    concurrency > 0 && totalRequests > 0
                      ? `~${Math.ceil(totalRequests / concurrency)} batches`
                      : '—'
                  }
                />
              </div>
            </Card>

            <Card style={{ padding: '16px', background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <PlayCircle size={14} style={{ color: 'var(--accent)', marginTop: '1px', flexShrink: 0 }} />
                <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                  After clicking <strong style={{ color: 'var(--text)' }}>Start</strong>, you'll be taken to the Live Dashboard where all metrics update in real-time over WebSocket.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </PageWrapper>
    </AppLayout>
  )
}

function ParamRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{label}</span>
      <span className="metric" style={{ fontSize: '13px', color: 'var(--text)' }}>{value}</span>
    </div>
  )
}
