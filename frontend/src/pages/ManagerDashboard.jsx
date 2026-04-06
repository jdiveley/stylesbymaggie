import { useState, useEffect, useCallback } from 'react'
import { format, isToday, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../lib/axios'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  'no-show': 'bg-gray-100 text-gray-600',
}

// ── Today's Schedule ─────────────────────────────────────────────────
const TodaySchedule = ({ bookings }) => {
  const todayBookings = bookings
    .filter((b) => isToday(parseISO(new Date(b.date).toISOString().split('T')[0])))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  if (todayBookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">☀️</div>
        <p className="text-gray-500">No appointments scheduled for today.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {todayBookings.map((b) => (
        <div key={b._id} className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex-shrink-0 w-16 text-center">
            <div className="text-lg font-bold text-sage-400">{b.startTime}</div>
            <div className="text-xs text-gray-400">{b.endTime}</div>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-800">{b.customerId?.name ?? 'Customer'}</div>
            <div className="text-sm text-gray-500">{b.serviceId?.name ?? 'Service'}</div>
            {b.notes && <div className="text-xs text-gray-400 mt-1 italic">"{b.notes}"</div>}
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] ?? ''}`}>
            {b.status}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Bookings Management ──────────────────────────────────────────────
const BookingsManagement = ({ bookings, onStatusChange }) => {
  if (bookings.length === 0) {
    return <p className="text-gray-400 text-sm italic">No bookings to display.</p>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <tr key={b._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{b.customerId?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{b.serviceId?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">
                  {format(new Date(b.date), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3 text-gray-500">{b.startTime}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] ?? ''}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {b.status === 'pending' && (
                      <button
                        onClick={() => onStatusChange(b._id, 'confirmed')}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                      >
                        Confirm
                      </button>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => onStatusChange(b._id, 'completed')}
                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                    {['pending', 'confirmed'].includes(b.status) && (
                      <button
                        onClick={() => onStatusChange(b._id, 'cancelled')}
                        className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => onStatusChange(b._id, 'no-show')}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors"
                      >
                        No-show
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Stylist Roster ───────────────────────────────────────────────────
const StylistRoster = () => {
  const [stylists, setStylists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/stylists')
      .then((res) => setStylists(res.data))
      .catch(() => toast.error('Failed to load stylists'))
      .finally(() => setLoading(false))
  }, [])

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>

  if (stylists.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">✂️</div>
        <p className="text-gray-500">No stylists have been added yet.</p>
        <p className="text-sm text-gray-400 mt-1">Ask the admin to add stylists from the Admin Dashboard.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stylists.map((s) => (
        <div key={s._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center text-sage-400 font-bold text-lg">
              {(s.userId?.name ?? 'S')[0]}
            </div>
            <div>
              <div className="font-semibold text-gray-800">{s.userId?.name ?? 'Stylist'}</div>
              <div className="text-xs text-gray-500">{s.userId?.email}</div>
            </div>
          </div>
          {s.bio && <p className="text-sm text-gray-600 mb-2">{s.bio}</p>}
          {s.specialties?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {s.specialties.map((sp) => (
                <span key={sp} className="px-2 py-0.5 bg-sage-50 text-sage-500 text-xs rounded-full">{sp}</span>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-400">
            Works: {s.workingDays.map((d) => DAY_NAMES[d]).join(', ')} &middot; {s.workingHours.start}–{s.workingHours.end}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Manager Dashboard ────────────────────────────────────────────────
const TABS = ['Today', 'All Bookings', 'Stylists']

export const ManagerDashboard = () => {
  const [tab, setTab] = useState('Today')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const loadBookings = useCallback(async () => {
    try {
      const res = await api.get('/bookings')
      setBookings(res.data)
    } catch { toast.error('Failed to load bookings') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadBookings() }, [loadBookings])

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status })
      toast.success('Status updated')
      loadBookings()
    } catch { toast.error('Update failed') }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white drop-shadow mb-6">Manager Dashboard</h1>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px ${
                tab === t ? 'bg-sage-400 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && tab !== 'Stylists' ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-sage-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'Today' && <TodaySchedule bookings={bookings} />}
            {tab === 'All Bookings' && <BookingsManagement bookings={bookings} onStatusChange={handleStatusChange} />}
            {tab === 'Stylists' && <StylistRoster />}
          </>
        )}
      </div>
    </div>
  )
}
