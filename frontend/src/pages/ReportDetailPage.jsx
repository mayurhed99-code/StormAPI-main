import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { BarChart2, Clock, CheckCircle, TrendingUp, ArrowLeft } from 'lucide-react'
import { AppLayout, PageWrapper, PageHeader } from '../components/Layout.jsx'
import { Card, Button, EmptyState } from '../components/ui.jsx'
import { reportsApi } from '../api/client.js'

function fmtMs(v, d = 1) {
  if (v == null) return '—'
  return `${Number(v).toFixed(d)} ms`
}
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ReportDetailPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    reportsApi.get(id)
      .then((r) => {
        setReport(r.data)
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Report not found')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <AppLayout>
        <PageWrapper>
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-2)' }}>Loading report…</div>
        </PageWrapper>
      </AppLayout>
    )
  }

  if (error || !report) {
    return (
      <AppLayout>
        <PageWrapper>
          <EmptyState icon={BarChart2} title="Report not found" description={error} action={
            <Button onClick={() => navigate('/reports')}>Back to reports</Button>
          } />
        </PageWrapper>
      </AppLayout>
    )
  }

  const totalReqs  = report.successCount + report.failureCount
  const successPct = totalReqs > 0 ? ((report.successCount / totalReqs) * 100).toFixed(1) : '0.0'

  const latencyChartData = [
    { name: 'Min',  value: report.minLatencyMs, color: '#22c55e' },
    { name: 'Avg',  value: parseFloat(report.avgLatencyMs?.toFixed(1) ?? 0), color: '#3b82f6' },
    { name: 'P95',  value: report.p95LatencyMs, color: '#f59e0b' },
    { name: 'Max',  value: report.maxLatencyMs, color: '#ef4444' },
  ]

  return (
    <AppLayout>
      <PageWrapper>
        <PageHeader
          title={`Report #${report.id}`}
          subtitle={`Run #${report.testRunId} · ${fmtDate(report.createdAt)}`}
          action={
            <Button variant="secondary" onClick={() => navigate('/reports')}>
              <ArrowLeft size={14} /> Back
            </Button>
          }
        />

        {/* Summary tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <ReportMetric icon={<Clock size={14} style={{ color: 'var(--accent)' }} />}     label="Avg Latency"    value={fmtMs(report.avgLatencyMs)} />
          <ReportMetric icon={<Clock size={14} style={{ color: 'var(--warning)' }} />}    label="P95 Latency"   value={fmtMs(report.p95LatencyMs, 0)} />
          <ReportMetric icon={<TrendingUp size={14} style={{ color: 'var(--text-2)' }} />} label="RPS"           value={report.rps?.toFixed(1) ?? '—'} />
          <ReportMetric icon={<CheckCircle size={14} style={{ color: 'var(--success)' }} />} label="Success Rate" value={`${successPct}%`} color={Number(successPct) >= 95 ? 'var(--success)' : 'var(--warning)'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Latency breakdown chart */}
          <Card style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>Latency Breakdown</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={latencyChartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-2)', fontFamily: 'var(--mono)' }}
                  tickFormatter={(v) => `${v}ms`}
                  width={48}
                />
                <Tooltip
                  formatter={(v) => [`${v} ms`]}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--text-2)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {latencyChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Success/failure breakdown */}
          <Card style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>Request Outcome</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <OutcomeBar label="Succeeded" count={report.successCount} total={totalReqs} color="var(--success)" />
              <OutcomeBar label="Failed"    count={report.failureCount} total={totalReqs} color="var(--danger)" />
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
              <StatRow label="Success count" value={report.successCount.toLocaleString()} />
              <StatRow label="Failure count" value={report.failureCount.toLocaleString()} />
              <StatRow label="Total"         value={totalReqs.toLocaleString()} />
            </div>
          </Card>
        </div>

        {/* Full stats table */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>Full Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <MetricDetail label="Min latency"  value={fmtMs(report.minLatencyMs, 0)} />
            <MetricDetail label="Avg latency"  value={fmtMs(report.avgLatencyMs)} />
            <MetricDetail label="P95 latency"  value={fmtMs(report.p95LatencyMs, 0)} />
            <MetricDetail label="Max latency"  value={fmtMs(report.maxLatencyMs, 0)} />
            <MetricDetail label="Throughput"   value={`${report.rps?.toFixed(2) ?? '—'} req/s`} />
            <MetricDetail label="Success rate" value={`${successPct}%`} />
            <MetricDetail label="Total reqs"   value={totalReqs.toLocaleString()} />
            <MetricDetail label="Run ID"       value={`#${report.testRunId}`} />
          </div>
        </Card>
      </PageWrapper>
    </AppLayout>
  )
}

function ReportMetric({ icon, label, value, color = 'var(--text)' }) {
  return (
    <Card style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--text-2)', fontSize: '12px' }}>
        {icon}{label}
      </div>
      <span className="metric" style={{ fontSize: '22px', fontWeight: 600, color }}>{value}</span>
    </Card>
  )
}

function OutcomeBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{label}</span>
        <span className="metric" style={{ fontSize: '12px', color }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: '6px', background: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.5s ease-out' }} />
      </div>
    </div>
  )
}

function StatRow({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '2px' }}>{label}</p>
      <p className="metric" style={{ fontSize: '14px', fontWeight: 600 }}>{value}</p>
    </div>
  )
}

function MetricDetail({ label, value }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 12px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p className="metric" style={{ fontSize: '15px', fontWeight: 600 }}>{value}</p>
    </div>
  )
}
