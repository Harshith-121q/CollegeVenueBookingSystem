import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'

const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

const initialForm = {
  date: today,
  startTime: '09:00',
  endTime: '10:00',
  reason: '',
}

export default function VenueBooking() {
  const navigate = useNavigate()
  const [venues, setVenues] = useState([])
  const [, setMyBookings] = useState([])
  const [selectedBlock, setSelectedBlock] = useState('')
  const [selectedFloor, setSelectedFloor] = useState('')
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [venueBookings, setVenueBookings] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadVenues = async () => {
    try {
      const res = await API.get('/venue/get_venues')
      setVenues(res.data?.payload || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load venues')
    }
  }

  const loadBookings = async () => {
    try {
      const res = await API.get('/venue_booking/my_bookings')
      setMyBookings(res.data?.payload || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking requests')
    }
  }

  useEffect(() => {
    const init = async () => {
      await loadVenues()
      await loadBookings()
    }
    void init()
  }, [])

  const blocks = useMemo(() => {
    return [...new Set(venues.map((venue) => venue.block))].sort()
  }, [venues])

  const floors = useMemo(() => {
    return [...new Set(venues.filter((venue) => venue.block === selectedBlock).map((venue) => venue.floor))]
      .filter((floor) => floor !== undefined && floor !== null)
      .sort((a, b) => a - b)
  }, [venues, selectedBlock])

  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => venue.block === selectedBlock && venue.floor === Number(selectedFloor))
  }, [venues, selectedBlock, selectedFloor])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    const load = async () => {
      if (!selectedVenue || !formData.date) {
        setVenueBookings([])
        return
      }

      try {
        const res = await API.get(`/venue_booking/venue_bookings/${selectedVenue._id}`, {
          params: { date: formData.date },
        })
        setVenueBookings(res.data?.payload || [])
      } catch (err) {
        console.error('Failed to load venue bookings', err)
        setVenueBookings([])
      }
    }

    void load()
  }, [selectedVenue, formData.date])

  const isOverlapping = (existingStart, existingEnd, newStart, newEnd) => {
    return existingStart < newEnd && existingEnd > newStart
  }

  const handleBookSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!selectedVenue) {
      setError('Please select a venue first.')
      return
    }

    const now = new Date()
    const todayString = today
    const selectedDateString = formData.date

    if (!selectedDateString || selectedDateString < todayString || selectedDateString > tomorrow) {
      setError('Bookings are allowed only for today or tomorrow.')
      return
    }

    const start = formData.startTime
    const end = formData.endTime

    if (start >= end) {
      setError('Please choose a valid time range where the start time is before the end time.')
      return
    }

    if (start < '09:00' || end > '15:00') {
      setError('Booking is allowed between 09:00 and 15:00 only.')
      return
    }

    if (selectedDateString === todayString) {
      const currentTime = now.toTimeString().slice(0, 5)
      if (start <= currentTime) {
        setError('You cannot book a time that has already passed. Please select a future time.')
        return
      }
    }

    const hasConflict = venueBookings.some((booking) => {
      return isOverlapping(booking.startTime, booking.endTime, start, end)
    })

    if (hasConflict) {
      setError('The selected time slot is already booked.')
      return
    }

    try {
      setLoading(true)
      const res = await API.post(`/venue_booking/book_venue/${selectedVenue._id}`, {
        ...formData,
        reason: formData.reason,
      })
      setMessage(res.data?.message || 'Venue request submitted')
      setFormData(initialForm)
      setSelectedVenue(null)
      await loadBookings()
    } catch (err) {
      const responseData = err?.response?.data || {}
      const serverMessage = responseData.message || responseData.error || (Array.isArray(responseData.errors) && responseData.errors[0])

      if (serverMessage) {
        setError(serverMessage)
      } else if (err?.message) {
        setError(err.message)
      } else {
        setError('Booking failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // status label helper removed (unused in this component)

  return (
    <div className="p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Book a Venue</h2>
              <p className="mt-3 text-slate-600">Select a building, then a floor, then choose an available room.</p>
            </div>
            <button
              onClick={() => navigate('/app/faculty-dashboard')}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Select Building</span>
              <select
                value={selectedBlock}
                onChange={(e) => {
                  setSelectedBlock(e.target.value)
                  setSelectedFloor('')
                  setSelectedVenue(null)
                }}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="">Choose building</option>
                {blocks.map((block) => (
                  <option key={block} value={block}>{block}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Select Floor</span>
              <select
                value={selectedFloor}
                onChange={(e) => {
                  setSelectedFloor(e.target.value)
                  setSelectedVenue(null)
                }}
                disabled={!selectedBlock}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">Choose floor</option>
                {floors.map((floor) => (
                  <option key={floor} value={floor}>Floor {floor}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {selectedBlock && selectedFloor && (
          <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Available Venues</h3>
            {filteredVenues.length === 0 ? (
              <p className="text-slate-600">No venues found for this selection.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredVenues.map((venue) => (
                  <div key={venue._id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <h4 className="text-lg font-semibold text-slate-900">{venue.name}</h4>
                    <p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-slate-800">Room:</span> {venue.roomNumber}</p>
                    <p className="mt-2 text-sm text-slate-600"><span className="font-semibold text-slate-800">Capacity:</span> {venue.capacity}</p>
                    <p className="mt-2 text-sm text-slate-600"><span className="font-semibold text-slate-800">Facilities:</span> {venue.facilities?.join(', ') || 'None'}</p>
                    <button
                      onClick={() => setSelectedVenue(venue)}
                      className="mt-6 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Select Venue
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {selectedVenue && (
          <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-semibold text-slate-900">Booking Form</h3>
            <p className="mt-2 text-slate-600"><span className="font-semibold text-slate-800">Selected Venue:</span> {selectedVenue.name} - Room {selectedVenue.roomNumber}</p>

            {message && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {error}
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="mt-6 grid gap-4">
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={today}
                max={tomorrow}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
              <p className="text-xs text-slate-500">Bookings are allowed only for today or tomorrow.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <textarea
                name="reason"
                placeholder="Reason for booking"
                value={formData.reason}
                onChange={handleChange}
                rows="3"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? 'Submitting...' : 'Book Venue'}
              </button>
            </form>
          </section>
        )}

      </div>
    </div>
  )
}

