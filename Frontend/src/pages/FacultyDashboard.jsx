import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'

export default function FacultyDashboard() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [selectedBookingIds, setSelectedBookingIds] = useState([])
  const [deletingBookings, setDeletingBookings] = useState(false)

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

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this pending booking request?')) {
      return
    }

    setCancellingId(bookingId)
    setError('')
    setSuccessMessage('')

    try {
      const res = await API.patch(`/venue_booking/cancel_booking/${bookingId}`)
      setSuccessMessage(res.data?.message || 'Booking cancelled successfully')
      await loadBookings()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setCancellingId(null)
    }
  }

  const toggleBookingSelection = (bookingId) => {
    setSelectedBookingIds((prev) => {
      if (prev.includes(bookingId)) {
        return prev.filter((id) => id !== bookingId)
      }

      return [...prev, bookingId]
    })
  }

  const handleDeleteSelectedBookings = async () => {
    if (selectedBookingIds.length === 0) {
      return
    }

    if (!window.confirm('Delete the selected booking history entries?')) {
      return
    }

    setDeletingBookings(true)
    setError('')
    setSuccessMessage('')

    try {
      const res = await API.delete('/venue_booking/delete_bookings', {
        data: { bookingIds: selectedBookingIds },
      })
      setSuccessMessage(res.data?.message || 'Selected bookings deleted successfully')
      setSelectedBookingIds([])
      await loadBookings()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete selected bookings')
    } finally {
      setDeletingBookings(false)
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

          {successMessage && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {successMessage}
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
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    disabled={cancellingId === booking._id}
                    className="mt-5 inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-2xl font-semibold text-slate-900">Booking History</h3>
            {bookingHistory.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelectedBookings}
                disabled={deletingBookings || selectedBookingIds.length === 0}
                className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {deletingBookings ? 'Deleting...' : `Delete Selected (${selectedBookingIds.length})`}
              </button>
            )}
          </div>
          {loading ? (
            <p className="text-slate-600">Loading booking history...</p>
          ) : bookingHistory.length === 0 ? (
            <p className="text-slate-600">No booking history yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {bookingHistory.map((booking) => {
                const isSelected = selectedBookingIds.includes(booking._id)

                return (
                  <div key={booking._id} className={`rounded-[28px] border p-6 shadow-sm ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{booking.venue?.name} - Room {booking.venue?.roomNumber}</p>
                      <button
                        type="button"
                        onClick={() => toggleBookingSelection(booking._id)}
                        aria-label={isSelected ? 'Deselect booking' : 'Select booking'}
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white hover:border-blue-400'}`}
                      >
                        {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">Date: {new Date(booking.date).toLocaleDateString()}</p>
                    <p className="mt-1 text-sm text-slate-600">Time: {booking.startTime} to {booking.endTime}</p>
                    <p className="mt-2 text-sm text-slate-600">Status: <span className="font-semibold text-slate-900">{getStatusLabel(booking.bookedStatus)}</span></p>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

