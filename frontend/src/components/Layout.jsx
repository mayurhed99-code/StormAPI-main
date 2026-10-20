import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout, selectUser } from '../store/authSlice.js'
import { clearRun } from '../store/runSlice.js'
import {
  Zap, Target, PlayCircle, BarChart2, History,
  LogOut, LayoutDashboard,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/targets', icon: Target,          label: 'Targets'   },
  { to: '/run',     icon: PlayCircle,      label: 'New Test'  },
  { to: '/history', icon: History,         label: 'History'   },
  { to: '/reports', icon: BarChart2,       label: 'Reports'   },
]

const navStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 10px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 500,
  color: active ? 'var(--text)' : 'var(--text-2)',
  background: active ? 'var(--surface-2)' : 'transparent',
  border: active ? '1px solid var(--border)' : '1px solid transparent',
  textDecoration: 'none',
  transition: 'all 0.15s',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
})

export function AppLayout({ children }) {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const user       = useSelector(selectUser)

  const handleLogout = () => {
    dispatch(clearRun())
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <nav style={{
        width: '220px',
        flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
      }}>
        {/* Logo */}
        <div style={{
          padding: '18px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Zap size={20} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em' }}>
            Storm<span style={{ color: 'var(--accent)' }}>API</span>
          </span>
        </div>

        {/* Nav links */}
        <div style={{ padding: '10px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => navStyle(isActive)}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* User + logout */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '10px 8px',
        }}>
          <div style={{ padding: '4px 10px', marginBottom: '4px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Signed in as</p>
            <p style={{ fontSize: '12px', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={navStyle(false)}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  )
}

// Page wrapper with consistent padding + fade-in
export function PageWrapper({ children, style = {} }) {
  return (
    <div
      className="animate-fade-in"
      style={{ padding: '24px 28px', flex: 1, ...style }}
    >
      {children}
    </div>
  )
}

// Page header
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '24px',
    }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '2px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
