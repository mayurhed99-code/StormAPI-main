import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute.jsx'
import { ToastContainer } from './components/Toast.jsx'

import LoginPage      from './pages/LoginPage.jsx'
import RegisterPage   from './pages/RegisterPage.jsx'
import DashboardPage  from './pages/DashboardPage.jsx'
import TargetsPage    from './pages/TargetsPage.jsx'
import NewTestPage    from './pages/NewTestPage.jsx'
import LiveDashboardPage from './pages/LiveDashboardPage.jsx'
import ReportsPage    from './pages/ReportsPage.jsx'
import ReportDetailPage from './pages/ReportDetailPage.jsx'
import HistoryPage    from './pages/HistoryPage.jsx'

export default function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/targets" element={<ProtectedRoute><TargetsPage /></ProtectedRoute>} />
        <Route path="/run"     element={<ProtectedRoute><NewTestPage /></ProtectedRoute>} />
        <Route path="/live/:runId" element={<ProtectedRoute><LiveDashboardPage /></ProtectedRoute>} />
        <Route path="/reports"    element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/reports/:id" element={<ProtectedRoute><ReportDetailPage /></ProtectedRoute>} />
        <Route path="/history"    element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global toast notifications */}
      <ToastContainer />
    </>
  )
}
