import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History, ArrowRight, PlayCircle } from 'lucide-react'
import { AppLayout, PageWrapper, PageHeader } from '../components/Layout.jsx'
import { Card, Button, StatusBadge, EmptyState } from '../components/ui.jsx'
import { runsApi, reportsApi } from '../api/client.js'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function duration(start, end) {
  if (!start || !end) return '—'
  const ms = new Date(end) - new Date(start)
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function HistoryPage() {
  const navigate  = useNavigate()
  const [runs, setRuns]         = useState([])
  const [reportMap, setReportMap] = useState({})  // runId → reportId
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([runsApi.list(), reportsApi.list()])
      .then(([runsRes, reportsRes]) => {
        setRuns(runsRes.data)
        // Build a map: testRunId → report.id
        const map = {}
        reportsRes.data.forEach((r) => { map[r.testRunId] = r.id })
        setReportMap(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <PageWrapper>
        <PageHeader
          title="History"
          subtitle="All previous load test executions"
          action={
            <Button onClick={() => navigate('/run')}>
              <PlayCircle size={14} /> New Test
            </Button>
          }
        />

        <Card style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-2)' }}>Loading…</div>
          ) : runs.length === 0 ? (
            <EmptyState
              icon={History}
              title="No test runs yet"
              description="Start your first load test to see the history here"
              action={<Button onClick={() => navigate('/run')}>Start a test</Button>}
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Run ID', 'Config', 'Status', 'Started', 'Duration', 'Actions'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 14px',
                      fontSize: '11px', color: 'var(--text-2)',
                      fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <span className="metric" style={{ fontSize: '13px', color: 'var(--text-2)' }}>#{run.id}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="metric" style={{ fontSize: '12px', color: 'var(--text-2)' }}>cfg #{run.testConfigId}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <StatusBadge status={run.status} />
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-2)' }}>
                      {fmtDate(run.startedAt)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="metric" style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                        {duration(run.startedAt, run.endedAt)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {run.status === 'RUNNING' && (
                          <Button size="sm" onClick={() => navigate(`/live/${run.id}`)}>
                            View Live
                          </Button>
                        )}
                        {reportMap[run.id] && (
                          <Button size="sm" variant="secondary" onClick={() => navigate(`/reports/${reportMap[run.id]}`)}>
                            Report <ArrowRight size={11} />
                          </Button>
                        )}
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
