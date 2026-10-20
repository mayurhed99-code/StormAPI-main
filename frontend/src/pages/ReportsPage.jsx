import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2, ArrowRight } from 'lucide-react'
import { AppLayout, PageWrapper, PageHeader } from '../components/Layout.jsx'
import { Card, Button, EmptyState } from '../components/ui.jsx'
import { reportsApi } from '../api/client.js'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ReportsPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportsApi.list()
      .then((r) => setReports(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <PageWrapper>
        <PageHeader title="Reports" subtitle="Completed load test results" />

        <Card style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-2)' }}>Loading…</div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={BarChart2}
              title="No reports yet"
              description="Complete a load test to see your first report"
              action={<Button onClick={() => navigate('/run')}>Start a test</Button>}
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Run #', 'Avg Latency', 'P95', 'RPS', 'Success', 'Failures', 'Date', ''].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 14px',
                      fontSize: '11px', color: 'var(--text-2)',
                      fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const total = r.successCount + r.failureCount
                  const pct   = total > 0 ? ((r.successCount / total) * 100).toFixed(1) : '—'
                  return (
                    <tr key={r.id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate(`/reports/${r.id}`)}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span className="metric" style={{ fontSize: '13px', color: 'var(--text-2)' }}>#{r.testRunId}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="metric" style={{ fontSize: '13px' }}>{r.avgLatencyMs?.toFixed(1)} ms</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="metric" style={{ fontSize: '13px', color: 'var(--warning)' }}>{r.p95LatencyMs} ms</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="metric" style={{ fontSize: '13px' }}>{r.rps?.toFixed(1)}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="metric" style={{ fontSize: '13px', color: Number(pct) >= 95 ? 'var(--success)' : 'var(--warning)' }}>
                          {pct}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="metric" style={{ fontSize: '13px', color: r.failureCount > 0 ? 'var(--danger)' : 'var(--text-2)' }}>
                          {r.failureCount.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-2)' }}>
                        {fmtDate(r.createdAt)}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <ArrowRight size={14} style={{ color: 'var(--text-3)' }} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      </PageWrapper>
    </AppLayout>
  )
}
