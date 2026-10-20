import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthed } from '../store/authSlice.js'

export function ProtectedRoute({ children }) {
  const isAuthed = useSelector(selectIsAuthed)
  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }
  return children
}

export function PublicRoute({ children }) {
  const isAuthed = useSelector(selectIsAuthed)
  if (isAuthed) {
    return <Navigate to="/" replace />
  }
  return children
}
