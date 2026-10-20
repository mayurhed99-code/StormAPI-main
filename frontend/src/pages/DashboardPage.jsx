import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Target, PlayCircle, CheckCircle, TrendingUp, Zap, Clock } from 'lucide-react'
import { AppLayout, PageWrapper, PageHeader } from '../components/Layout.jsx'
import { Card, StatusBadge, Button } from '../components/ui.jsx'
import { targetsApi, runsApi, reportsApi } from '../api/client.js'
import { selectUser } from '../store/authSlice.js'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user     = useSelector(selectUser)

  const [targets, setTargets]   = useState([])
  const [runs,    setRuns]      = useState([])
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      targetsApi.list(),
      runsApi.list(),
      reportsApi.list(),
    ]).then(([t, r, rep]) => {
      if (!mounted) return
      setTargets(t.data)
      setRuns(r.data)
      setReports(rep.data)
    }).catch(() => {}).finally(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const recentRuns    = runs.slice(0, 5)
  const totalRuns     = runs.length
  const successRuns   = runs.filter((r) => r.status === 'DONE').length
  const runningRuns   = runs.filter((r) => r.status === 'RUNNING').length
  const avgLatency    = reports.length
    ? (reports.reduce((s, r) => s + r.avgLatencyMs, 0) / reports.length).toFixed(0)
    : null

  return (
    <AppLayout>
      <PageWrapper>
        <PageHeader
          title={`Welcome back${user?.email ? ', ' + user.email.split('@')[0] : ''}`}
          subtitle="Concurrent HTTP load testing platform"
        />

        {/* Summary tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <SummaryTile
            icon={<Target size={16} style={{ color: 'var(--accent)' }} />}
            label="Targets"
            value={loading ? '—' : targets.length}
            onClick={() => navigate('/targets')}
          />
          <SummaryTile
            icon={<PlayCircle size={16} style={{ color: 'var(--success)' }} />}
            label="Total Runs"
            value={loading ? '—' : totalRuns}
            onClick={() => navigate('/history')}
          />
          <SummaryTile
            icon={<CheckCircle size={16} style={{ color: 'var(--success)' }} />}
            label="Successful"
            value={loading ? '—' : successRuns}
          />
          <SummaryTile
            icon={<TrendingUp size={16} style={{ color: 'var(--warning)' }} />}
            label="Avg Latency"
            value={loading ? '—' : (avgLatency ? `${avgLatency} ms` : '—')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Recent runs */}
          <Card style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600 }}>Recent Runs</h3>
              <Button size="sm" variant="ghost" onClick={() => navigate('/history')}>View all</Button>
            </div>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-2)', fontSize: '13px' }}>Loading…</div>
            ) : recentRuns.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-2)', fontSize: '13px' }}>
                No runs yet. <Button size="sm" variant="ghost" onClick={() => navigate('/run')}>Start one →</Button>
              </div>
            ) : (
              <div>
                {recentRuns.map((run) => (
                  <div key={run.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px', borderBottom: '1px solid var(--border)',
                    fontSize: '13px',
                  }}>
                    <div>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)', fontSize: '11px' }}>
                        #{run.id}
                      </span>
                      <p style={{ color: 'var(--text-2)', fontSize: '11px', marginTop: '2px' }}>
                        <Clock size={10} style={{ marginRight: '3px', verticalAlign: 'middle' }} />
                        {fmtDate(run.startedAt)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={run.status} />
                      {run.status === 'RUNNING' && (
                        <Button size="sm" variant="primary" onClick={() => navigate(`/live/${run.id}`)}>
                          View Live
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick start */}
          <Card style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>Quick Start</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <QuickStep num={1} text="Register an API target" action={<Button size="sm" variant="secondary" onClick={() => navigate('/targets')}>Targets →</Button>} />
              <QuickStep num={2} text="Configure a load test" action={<Button size="sm" variant="secondary" onClick={() => navigate('/run')}>New Test →</Button>} />
              <QuickStep num={3} text="Watch live metrics stream" action={null} />
              <QuickStep num={4} text="Review the final report" action={<Button size="sm" variant="secondary" onClick={() => navigate('/reports')}>Reports →</Button>} />
            </div>

            {runningRuns > 0 && (
              <div style={{
                marginTop: '16px',
                padding: '10px 12px',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={14} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>
                    {runningRuns} run{runningRuns > 1 ? 's' : ''} active
                  </span>
                </div>
                <Button size="sm" onClick={() => navigate(`/live/${runs.find(r => r.status === 'RUNNING')?.id}`)}>
                  View Dashboard →
                </Button>
              </div>
            )}
          </Card>
        </div>
      </PageWrapper>
    </AppLayout>
  )
}

function SummaryTile({ icon, label, value, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-2)', fontSize: '12px' }}>
        {icon}
        {label}
      </div>
      <span className="metric" style={{ fontSize: '24px', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function QuickStep({ num, text, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          width: '22px', height: '22px', borderRadius: '50%',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', flexShrink: 0,
        }}>{num}</span>
        <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{text}</span>
      </div>
      {action}
    </div>
  )
}
