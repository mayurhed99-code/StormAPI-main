/**
 * Reusable UI primitives — all styled to DESIGN.md spec.
 * No external UI library; pure HTML + inline styles using CSS variables.
 */

// ── Button ────────────────────────────────────────────────────────────────
export function Button({
  children, onClick, type = 'button', variant = 'primary',
  disabled = false, loading = false, className = '', fullWidth = false,
  size = 'md',
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    border: '1px solid transparent',
    borderRadius: '6px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    fontWeight: 500,
    transition: 'background 0.15s, opacity 0.15s',
    width: fullWidth ? '100%' : undefined,
    opacity: disabled || loading ? 0.55 : 1,
    outline: 'none',
  }
  const sizes = {
    sm: { fontSize: '12px', padding: '4px 10px', height: '28px' },
    md: { fontSize: '13px', padding: '6px 14px', height: '34px' },
    lg: { fontSize: '14px', padding: '8px 18px', height: '38px' },
  }
  const variants = {
    primary: {
      background: 'var(--accent)',
      color: '#fff',
      borderColor: 'var(--accent)',
    },
    secondary: {
      background: 'var(--surface-2)',
      color: 'var(--text)',
      borderColor: 'var(--border)',
    },
    danger: {
      background: 'transparent',
      color: 'var(--danger)',
      borderColor: 'var(--danger)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-2)',
      borderColor: 'transparent',
    },
  }
  const style = { ...base, ...sizes[size], ...variants[variant] }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
      className={className}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 18 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Badge / Status ────────────────────────────────────────────────────────
const STATUS_COLORS = {
  RUNNING: { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent)',  dot: 'var(--accent)'  },
  DONE:    { bg: 'rgba(34,197,94,0.15)',  color: 'var(--success)', dot: 'var(--success)' },
  FAILED:  { bg: 'rgba(239,68,68,0.15)', color: 'var(--danger)',  dot: 'var(--danger)'  },
}

export function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: 'rgba(139,152,165,0.15)', color: 'var(--text-2)', dot: 'var(--text-2)' }
  const isRunning = status === 'RUNNING'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: c.bg, color: c.color,
      fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em',
      padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0,
        animation: isRunning ? 'pulse-dot 1.4s ease-in-out infinite' : 'none',
      }} />
      {status}
    </span>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────
export function Input({
  label, id, error, type = 'text', placeholder = '', register = {},
  ...rest
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        {...register}
        {...rest}
        style={{
          background: 'var(--surface-2)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: '6px',
          color: 'var(--text)',
          fontSize: '13px',
          padding: '7px 10px',
          outline: 'none',
          width: '100%',
          transition: 'border-color 0.15s',
          fontFamily: 'inherit',
        }}
      />
      {error && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────
export function Select({ label, id, error, children, register = {}, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <select
        id={id}
        {...register}
        {...rest}
        style={{
          background: 'var(--surface-2)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: '6px',
          color: 'var(--text)',
          fontSize: '13px',
          padding: '7px 10px',
          outline: 'none',
          width: '100%',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

// ── Alert / Error ─────────────────────────────────────────────────────────
export function Alert({ message, type = 'error' }) {
  if (!message) return null
  const colors = {
    error:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  color: '#fca5a5' },
    success: { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)',  color: '#86efac' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#fcd34d' },
  }
  const c = colors[type]
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: '6px',
      color: c.color, fontSize: '13px', padding: '8px 12px',
      animation: 'fade-in 0.2s ease-out',
    }}>
      {message}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '10px', padding: '48px 24px', color: 'var(--text-2)', textAlign: 'center',
    }}>
      {Icon && <Icon size={32} strokeWidth={1.5} style={{ color: 'var(--text-3)' }} />}
      <p style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: '14px' }}>{title}</p>
      {description && <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>{description}</p>}
      {action}
    </div>
  )
}

// ── Metric tile ───────────────────────────────────────────────────────────
export function MetricTile({ label, value, unit = '', color = 'var(--text)', size = 'lg' }) {
  const fontSize = size === 'lg' ? '32px' : size === 'md' ? '24px' : '18px'
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <span style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span
        className="metric"
        style={{ fontSize, fontWeight: 600, color, lineHeight: 1, minWidth: '6ch' }}
      >
        {value}
        {unit && <span style={{ fontSize: '14px', color: 'var(--text-2)', marginLeft: '4px' }}>{unit}</span>}
      </span>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '2px' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// Toast is in components/Toast.jsx — import from there
