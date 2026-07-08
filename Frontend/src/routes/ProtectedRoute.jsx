import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { token , loading } = useAuth()

  // ⏳ Wait until auth is initialized
  if (loading) {
    return <p>Loading...</p>   // or spinner
  }

  // 🚫 Not logged in
  if (!token) {
    return <Navigate to="/" replace />
  }

  // ✅ Logged in
  return children
}
