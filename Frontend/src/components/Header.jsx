 
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Header() { 
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="flex items-center justify-between px-6 py-5 bg-slate-900 text-white">
      <div>
        <h3 className="text-xl font-semibold">Venue Booking System</h3>
        {user && <p className="mt-1 text-sm text-slate-300">Logged in as {user.name || user.email}</p>}
      </div>

      <button
        onClick={handleLogout}
        className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
      >
        Logout
      </button>
    </header>
  )
}
