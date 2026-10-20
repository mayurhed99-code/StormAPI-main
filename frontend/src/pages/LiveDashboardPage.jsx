import { useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Activity, CheckCircle, XCircle, Zap, Clock, TrendingUp } from 'lucide-react'
import { AppLayout, PageWrapper } from '../components/Layout.jsx'
import { Card, StatusBadge, Button } from '../components/ui.jsx'
import { useRunWebSocket } from '../hooks/useRunWebSocket.js'
import { updateProgress, selectProgress, selectLatencyHistory } from '../store/runSlice.js'
import { toast } from '../components/toastApi.js'

function fmt(n, decimals = 0) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toFixed(decimals)
}

function fmtLarge(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString()
}

// Custom tooltip for the latency chart
function LatencyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '6px', padding: '6px 10px', fontSize: '12px',
    }}>
      <span className="metric" style={{ color: 'var(--accent)' }}>
        {fmt(payload[0]?.value, 1)} ms
      </span>
    </div>
  )
}

export default function LiveDashboardPage() {
  const { runId } = useParams()
  const dispatch  = useDispatch()
  const navigate  = useNavigate()

  const progress       = useSelector(selectProgress)
  const latencyHistory = useSelector(selectLatencyHistory)

  const finalized = useRef(false)
  const runIdNum  = Number(runId)

  const onMessage = useCallback((payload) => {
    dispatch(updateProgress(payload))

    // When the server signals FINISHED, transition to report after a short delay
    if (payload.status === 'FINISHED' || payload.status === 'DONE') {
      if (!finalized.current) {
        finalized.current = true
        toast('Test complete! Loading report…', 'success')
        setTimeout(() => navigate('/reports'), 2500)
      }
    }
  }, [dispatch, navigate])

  useRunWebSocket(runIdNum, onMessage)

  const status    = progress?.status ?? 'RUNNING'
  const completed = progress?.completed ?? 0
  const total     = progress?.total ?? 0
  const failures  = progress?.failures ?? 0
  const successes = Math.max(0, completed - failures)
  const avgMs     = progress?.avgLatencyMs ?? 0

  const pct = total > 0 ? Math.min(100, (completed / total) * 100) : 0


  // Chart data — show last 30 points with relative timestamps
  const chartData = latencyHistory.slice(-30).map((p, i) => ({
    t: i,
    latency: parseFloat(p.v.toFixed(1)),
  }))

  return (
    <AppLayout>
      <PageWrapper>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Live Dashboard</h1>
              <StatusBadge status={status === 'RUNNING' || status === 'FINISHED' ? 'RUNNING' : status} />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              Run <span className="metric" style={{ color: 'var(--text)' }}>#{runId}</span>
              {' — '} real-time metrics via WebSocket
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/history')}>
            View History
          </Button>
        </div>

        {/* Progress bar */}
        <Card style={{ padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={15} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Execution Progress</span>
            </div>
            <span className="metric" style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              {fmtLarge(completed)} / {fmtLarge(total || '?')} requests
            </span>
          </div>

          {/* Progress track */}
          <div style={{
            width: '100%', height: '12px', background: 'var(--surface-2)',
            borderRadius: '6px', overflow: 'hidden', position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: status === 'DONE'
                ? 'var(--success)'
                : `linear-gradient(90deg, var(--accent-dim), var(--accent))`,
              borderRadius: '6px',
              transition: 'width 0.4s ease-out',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Shimmer when running */}
              {status === 'RUNNING' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                  animation: 'progress-shine 2s ease-in-out infinite',
                }} />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>
              {failures > 0 && (
                <span style={{ color: 'var(--danger)' }}>{fmtLarge(failures)} failed</span>
              )}
            </span>
            <span className="metric" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
              {pct.toFixed(1)}%
            </span>
          </div>
        </Card>

        {/* Metric tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <LiveMetricTile
            icon={<Clock size={15} style={{ color: 'var(--accent)' }} />}
            label="Avg Latency"
            value={fmt(avgMs, 1)}
            unit="ms"
            color="var(--text)"
          />
          <LiveMetricTile
            icon={<CheckCircle size={15} style={{ color: 'var(--success)' }} />}
            label="Succeeded"
            value={fmtLarge(successes)}
            color="var(--success)"
          />
          <LiveMetricTile
            icon={<XCircle size={15} style={{ color: 'var(--danger)' }} />}
            label="Failed"
            value={fmtLarge(failures)}
            color={failures > 0 ? 'var(--danger)' : 'var(--text)'}
          />
          <LiveMetricTile
            icon={<TrendingUp size={15} style={{ color: 'var(--warning)' }} />}
            label="Completed"
            value={fmtLarge(completed)}
            color="var(--text)"
          />
        </div>

        {/* Live latency chart */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Zap size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Avg Latency Over Time</span>
            <span style={{ fontSize: '11px', color: 'var(--text-2)', marginLeft: '4px' }}>
              Live — last {Math.min(30, chartData.length)} samples
            </span>
          </div>

          {chartData.length < 2 ? (
            <div style={{
              height: '180px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '8px',
              color: 'var(--text-2)', fontSize: '13px',
            }}>
              <Activity size={24} style={{ color: 'var(--text-3)', animation: 'pulse-dot 1.4s ease-in-out infinite' }} />
              Waiting for data…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="t" hide />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-2)', fontFamily: 'var(--mono)' }}
                  tickFormatter={(v) => `${v}ms`}
                  width={48}
                />
                <Tooltip content={<LatencyTooltip />} />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* DONE state overlay */}
        {(status === 'DONE' || status === 'FINISHED') && (
          <Card style={{
            marginTop: '16px', padding: '20px',
            background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }} className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={18} style={{ color: 'var(--success)' }} />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--success)' }}>Test complete</p>
                <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>
                  Redirecting to report…
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/reports')}>View Report</Button>
          </Card>
        )}
      </PageWrapper>
    </AppLayout>
  )
}

function LiveMetricTile({ icon, label, value, unit = '', color = 'var(--text)' }) {
  return (
    <Card style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-2)', fontSize: '12px' }}>
        {icon}
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span
          className="metric"
          style={{ fontSize: '32px', fontWeight: 600, color, lineHeight: 1, minWidth: '4ch' }}
        >
          {value}
        </span>
        {unit && <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{unit}</span>}
      </div>
    </Card>
  )
}
