import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RoleBasedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p>Loading...</p>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  const currentRole = user.role?.toLowerCase?.() ?? ""
  const required = requiredRole?.toLowerCase?.() ?? ""

  if (required && currentRole !== required) {
    return <Navigate to="/app" replace />
  }

  return children
}
