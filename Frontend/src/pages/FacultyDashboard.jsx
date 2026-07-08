import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'

export default function FacultyDashboard() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadBookings = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await API.get('/venue_booking/my_bookings')
      setBookings(res.data?.payload || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      await loadBookings()
    }
    void init()
  }, [])

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.bookedStatus === 'pending'),
    [bookings],
  )

  const bookingHistory = useMemo(
    () => bookings.filter((booking) => booking.bookedStatus !== 'pending'),
    [bookings],
  )

  const getStatusLabel = (status) => {
    switch (status) {
      case 'booked':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Pending'
    }
  }

  return (
    <div className="p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Faculty Dashboard</h2>
              <p className="mt-2 text-slate-600">Book venues and monitor your requests from here.</p>
            </div>
            <button
              onClick={() => navigate('/app/venue-booking')}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Venue Booking
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}
        </div>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-semibold text-slate-900 mb-4">Pending Booking Queue</h3>
          {loading ? (
            <p className="text-slate-600">Loading bookings...</p>
          ) : pendingBookings.length === 0 ? (
            <p className="text-slate-600">No pending booking requests.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pendingBookings.map((booking) => (
                <div key={booking._id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{booking.venue?.name} - Room {booking.venue?.roomNumber}</p>
                  <p className="mt-3 text-sm text-slate-600">Date: {new Date(booking.date).toLocaleDateString()}</p>
                  <p className="mt-1 text-sm text-slate-600">Time: {booking.startTime} to {booking.endTime}</p>
                  <p className="mt-2 text-sm text-slate-600">Status: <span className="font-semibold text-slate-900">{getStatusLabel(booking.bookedStatus)}</span></p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-semibold text-slate-900 mb-4">Booking History</h3>
          {loading ? (
            <p className="text-slate-600">Loading booking history...</p>
          ) : bookingHistory.length === 0 ? (
            <p className="text-slate-600">No booking history yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {bookingHistory.map((booking) => (
                <div key={booking._id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{booking.venue?.name} - Room {booking.venue?.roomNumber}</p>
                  <p className="mt-3 text-sm text-slate-600">Date: {new Date(booking.date).toLocaleDateString()}</p>
                  <p className="mt-1 text-sm text-slate-600">Time: {booking.startTime} to {booking.endTime}</p>
                  <p className="mt-2 text-sm text-slate-600">Status: <span className="font-semibold text-slate-900">{getStatusLabel(booking.bookedStatus)}</span></p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

