import { useEffect, useState } from 'react'
import API from '../api/axios'

const initialForm = {
  name: '',
  roomNumber: '',
  type: 'CLASSROOM',
  capacity: '',
  block: '',
  floor: '',
  facilities: '',
}

export default function AdminDashboard() {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(initialForm)
  const [venues, setVenues] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [decisionReason, setDecisionReason] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [editingVenueId, setEditingVenueId] = useState('')
  const [editForm, setEditForm] = useState(initialForm)

  const [automationEnabled, setAutomationEnabled] = useState(true)

  const loadVenues = async () => {
    try {
      setLoading(true)
      const res = await API.get('/venue/get_venues')
      setVenues(res.data?.payload || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load venues')
    } finally {
      setLoading(false)
    }
  }

  const loadAutomationSetting = async () => {
    try {
      const res = await API.get('/venue_booking/automation_setting')
      setAutomationEnabled(res.data?.payload?.enabled ?? true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load automation setting')
    }
  }

  const loadRequests = async () => {
    try {
      const res = await API.get('/venue_booking/admin_requests')
      setRequests(res.data?.payload || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests')
    }
  }

  useEffect(() => {
    loadVenues()
    loadRequests()
    loadAutomationSetting()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      const payload = {
        ...formData,
        capacity: Number(formData.capacity),
        floor: formData.floor ? Number(formData.floor) : undefined,
        facilities: formData.facilities
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }

      const res = await API.post('/venue/create_venue', payload)
      setMessage(res.data?.message || 'Venue created successfully')
      setFormData(initialForm)
      setShowForm(false)
      await loadVenues()
    } catch (err) {
      setError(err.response?.data?.message || 'Venue creation failed')
    }
  }

  const startEditingVenue = (venue) => {
    setEditingVenueId(venue._id)
    setEditForm({
      name: venue.name || '',
      roomNumber: venue.roomNumber?.toString() || '',
      type: venue.type || 'CLASSROOM',
      capacity: venue.capacity?.toString() || '',
      block: venue.block || '',
      floor: venue.floor?.toString() || '',
      facilities: Array.isArray(venue.facilities) ? venue.facilities.join(', ') : venue.facilities || '',
    })
  }

  const handleUpdateVenue = async (e, venueId) => {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      const payload = {
        ...editForm,
        roomNumber: Number(editForm.roomNumber),
        capacity: Number(editForm.capacity),
        floor: editForm.floor ? Number(editForm.floor) : undefined,
        facilities: editForm.facilities
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }

      const res = await API.put(`/venue/update_venue/${venueId}`, payload)
      setMessage(res.data?.message || 'Venue updated successfully')
      setEditingVenueId('')
      setEditForm(initialForm)
      await loadVenues()
    } catch (err) {
      setError(err.response?.data?.message || 'Venue update failed')
    }
  }

  const handleDeleteVenue = async (venueId) => {
    const confirmed = window.confirm('Delete this venue?')
    if (!confirmed) return

    try {
      const res = await API.delete(`/venue/delete_venue/${venueId}`)
      setMessage(res.data?.message || 'Venue deleted successfully')
      await loadVenues()
    } catch (err) {
      setError(err.response?.data?.message || 'Venue deletion failed')
    }
  }
// here admin is handling the approval 
  const handleAutomationToggle = async () => {
    try {
      const res = await API.patch('/venue_booking/automation_setting', {
        enabled: !automationEnabled,
      })
      setAutomationEnabled(res.data?.payload?.enabled ?? !automationEnabled)
      setMessage(res.data?.message || 'Automation setting updated')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update automation setting')
    }
  }

  const parseBookingEndTime = (request) => {
    if (!request?.date || !request?.endTime) return null

    const timeParts = request.endTime.split(':').map(Number)
    if (timeParts.length !== 2 || Number.isNaN(timeParts[0]) || Number.isNaN(timeParts[1])) {
      return null
    }

    if (typeof request.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(request.date)) {
      const [year, month, day] = request.date.split('-').map(Number)
      return new Date(year, month - 1, day, timeParts[0], timeParts[1], 0)
    }

    const parsedDate = new Date(request.date)
    return Number.isNaN(parsedDate.getTime())
      ? null
      : new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), timeParts[0], timeParts[1], 0)
  }

  const isBookingWindowExpired = (request) => {
    const bookingEndTime = parseBookingEndTime(request)
    if (!bookingEndTime) return false

    return new Date() > bookingEndTime
  }

  const handleDecision = async (bookingId, bookedStatus) => {
    const request = requests.find((item) => item._id === bookingId)
    if (request && isBookingWindowExpired(request)) {
      setError('This booking window has already ended, so it can no longer be accepted or rejected.')
      return
    }

    try {
      const res = await API.patch(`/venue_booking/update_status/${bookingId}`, {
        bookedStatus,
        reason: decisionReason,
      })
      setMessage(res.data?.message || 'Booking updated')
      setDecisionReason('')
      setSelectedRequestId('')
      await loadRequests()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking')
    }
  }

  return (
    <div className="p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Admin Dashboard</h2>
              <p className="mt-2 text-slate-600">Manage venues from here.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">AI Automation</span>
                  <span className="text-xs text-slate-500">{automationEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <button
                  onClick={handleAutomationToggle}
                  className={`h-8 w-16 rounded-full p-1 transition ${automationEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  aria-label="Toggle AI automation"
                >
                  <span className={`block h-6 w-6 rounded-full bg-white transition ${automationEnabled ? 'translate-x-8' : 'translate-x-0'}`} />
                </button>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Create Venue
              </button>
            </div>
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
        </div>

        {showForm && (
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6">Create New Venue</h3>
            <form onSubmit={handleSubmit} className="grid gap-6">
              <input
                name="name"
                placeholder="Venue Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              <input
                name="roomNumber"
                placeholder="Room Number"
                value={formData.roomNumber}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="CLASSROOM">Classroom</option>
                <option value="LAB">Lab</option>
                <option value="SEMINAR_HALL">Seminar Hall</option>
                <option value="AUDITORIUM">Auditorium</option>
              </select>

              <input
                name="capacity"
                type="number"
                placeholder="Capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="block"
                  placeholder="Block"
                  value={formData.block}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
                <input
                  name="floor"
                  type="number"
                  placeholder="Floor"
                  value={formData.floor}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <input
                name="facilities"
                placeholder="Facilities (comma separated)"
                value={formData.facilities}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Save Venue
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-semibold text-slate-900 mb-4">Venue List</h3>
          {loading ? (
            <p className="text-slate-600">Loading venues...</p>
          ) : venues.length === 0 ? (
            <p className="text-slate-600">No venues created yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {venues.map((venue) => (
                <div key={venue._id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  {editingVenueId === venue._id ? (
                    <form onSubmit={(e) => handleUpdateVenue(e, venue._id)} className="space-y-3">
                      <label className="block text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Venue Name
                        <input
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                      </label>
                      <label className="block text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Room Number
                        <input
                          name="roomNumber"
                          type="number"
                          value={editForm.roomNumber}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                      </label>
                      <label className="block text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Venue Type
                        <select
                          name="type"
                          value={editForm.type}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        >
                          <option value="CLASSROOM">Classroom</option>
                          <option value="LAB">Lab</option>
                          <option value="SEMINAR_HALL">Seminar Hall</option>
                          <option value="AUDITORIUM">Auditorium</option>
                        </select>
                      </label>
                      <label className="block text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Capacity
                        <input
                          name="capacity"
                          type="number"
                          value={editForm.capacity}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                      </label>
                      <label className="block text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Block
                        <input
                          name="block"
                          value={editForm.block}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                      </label>
                      <label className="block text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Floor
                        <input
                          name="floor"
                          type="number"
                          value={editForm.floor}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                      </label>
                      <label className="block text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Facilities
                        <input
                          name="facilities"
                          value={editForm.facilities}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                          placeholder="Facilities"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button type="submit" className="rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Save</button>
                        <button type="button" onClick={() => setEditingVenueId('')} className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h4 className="text-lg font-semibold text-slate-900">{venue.name}</h4>
                      <p className="mt-2 text-sm text-slate-600">Room {venue.roomNumber}</p>
                      <p className="mt-1 text-sm text-slate-600">{venue.type}</p>
                      <p className="mt-1 text-sm text-slate-600">Capacity {venue.capacity}</p>
                      <p className="mt-1 text-sm text-slate-600">Block {venue.block}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingVenue(venue)}
                          className="rounded-2xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVenue(venue._id)}
                          className="rounded-2xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-semibold text-slate-900 mb-4">Booking Requests</h3>
          {requests.length === 0 ? (
            <p className="text-slate-600">No pending booking requests.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {requests.map((request) => {
                const expired = isBookingWindowExpired(request)

                return (
                  <div key={request._id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">{request.user?.name} requested {request.venue?.name}</p>
                    <p className="mt-3 text-sm text-slate-600">Room: {request.venue?.roomNumber}</p>
                    <p className="mt-1 text-sm text-slate-600">Date: {new Date(request.date).toLocaleDateString()}</p>
                    <p className="mt-1 text-sm text-slate-600">Time: {request.startTime} - {request.endTime}</p>
                    <p className="mt-2 text-sm text-slate-600">Reason: {request.reason || 'No reason provided'}</p>
                    {expired && (
                      <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        This booking window has already ended, so it cannot be accepted or rejected anymore.
                      </p>
                    )}
                    <textarea
                      value={selectedRequestId === request._id ? decisionReason : ''}
                      onChange={(e) => {
                        setSelectedRequestId(request._id)
                        setDecisionReason(e.target.value)
                      }}
                      placeholder="Enter reason for approval or rejection"
                      rows="3"
                      disabled={expired}
                      className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => handleDecision(request._id, 'booked')}
                        disabled={expired}
                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecision(request._id, 'rejected')}
                        disabled={expired}
                        className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        Reject
                      </button>
                    </div>
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

