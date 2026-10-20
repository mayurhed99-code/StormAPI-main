import { useState, useCallback, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { registerToastDispatch } from './toastApi.js'


const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
}
const COLORS = {
  success: { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  color: '#86efac', icon: '#22c55e' },
  error:   { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#fca5a5', icon: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#fcd34d', icon: '#f59e0b' },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev, t])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id))
    }, 4000)
  }, [])

  useEffect(() => {
    registerToastDispatch(addToast)
    return () => registerToastDispatch(null)
  }, [addToast])

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      zIndex: 9999, pointerEvents: 'none',
    }}>
      {toasts.map((t) => {
        const c = COLORS[t.type] || COLORS.success
        const Icon = ICONS[t.type] || CheckCircle
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: c.bg, border: `1px solid ${c.border}`,
            color: c.color, borderRadius: '8px',
            padding: '10px 14px', fontSize: '13px', fontWeight: 500,
            maxWidth: '360px', pointerEvents: 'all',
            animation: 'fade-in 0.2s ease-out',
            backdropFilter: 'blur(4px)',
          }}>
            <Icon size={16} style={{ color: c.icon, flexShrink: 0 }} />
            {t.message}
          </div>
        )
      })}
    </div>
  )
}
