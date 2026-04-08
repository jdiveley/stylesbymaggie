import { useState, useEffect, useCallback } from 'react'
import { format, isToday, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import { useContentContext } from '../context/ContentContext'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  'no-show': 'bg-gray-100 text-gray-600',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
            <div className="font-semibold text-gray-800 flex items-center gap-1.5">
              {b.guestName ?? b.customerId?.name ?? 'Customer'}
              {!b.customerId && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">Guest</span>}
            </div>
            {(b.guestEmail ?? b.customerId?.email) && (
              <div className="text-xs text-gray-400">{b.guestEmail ?? b.customerId?.email}</div>
            )}
            {b.guestPhone && (
              <div className="text-xs text-gray-400">{b.guestPhone}</div>
            )}
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
                <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 flex items-center gap-1.5">
                      {b.guestName ?? b.customerId?.name ?? '—'}
                      {!b.customerId && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">Guest</span>}
                    </div>
                    {(b.guestEmail ?? b.customerId?.email) && (
                      <div className="text-xs text-gray-400">{b.guestEmail ?? b.customerId?.email}</div>
                    )}
                  </td>
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
            Works: {(s.schedule ?? []).sort((a, b) => a.day - b.day).map((e) => `${DAY_NAMES[e.day]} ${e.start}–${e.end}`).join(', ')}
          </div>
        </div>
      ))}
    </div>
  )
}

const DEFAULT_SCHEDULE = [1, 2, 3, 4, 5].map((day) => ({ day, start: '09:00', end: '18:00' }))

// ── Availability Panel ───────────────────────────────────────────────
const AvailabilityPanel = ({ user }) => {
  const isPrivileged = user.role === 'admin' || user.role === 'owner'
  const [stylists, setStylists] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const applySchedule = (data) => {
    const raw = data.schedule?.length ? data.schedule : DEFAULT_SCHEDULE
    setSchedule(raw.map(({ day, start, end }) => ({ day, start, end })).sort((a, b) => a.day - b.day))
  }

  useEffect(() => {
    if (isPrivileged) {
      api.get('/stylists')
        .then((res) => {
          setStylists(res.data)
          if (res.data.length > 0) {
            setSelectedId(res.data[0]._id)
            applySchedule(res.data[0])
          }
        })
        .catch(() => toast.error('Failed to load stylists'))
        .finally(() => setLoading(false))
    } else {
      api.get('/stylists/me')
        .then((res) => {
          setSelectedId(res.data._id)
          applySchedule(res.data)
        })
        .catch(() => toast.error('Could not load your stylist profile'))
        .finally(() => setLoading(false))
    }
  }, [isPrivileged])

  const handleStylistChange = (id) => {
    const s = stylists.find((s) => s._id === id)
    setSelectedId(id)
    applySchedule(s)
  }

  const isActive = (day) => schedule.some((e) => e.day === day)

  const toggleDay = (day) => {
    setSchedule((prev) => {
      if (prev.some((e) => e.day === day)) {
        return prev.filter((e) => e.day !== day)
      }
      return [...prev, { day, start: '09:00', end: '18:00' }].sort((a, b) => a.day - b.day)
    })
  }

  const updateTime = (day, field, value) => {
    setSchedule((prev) => prev.map((e) => e.day === day ? { ...e, [field]: value } : e))
  }

  const handleSave = async () => {
    if (schedule.length === 0) {
      toast.error('Select at least one working day')
      return
    }
    setSaving(true)
    try {
      const res = await api.patch(`/stylists/${selectedId}/availability`, { schedule })
      if (isPrivileged) {
        setStylists((prev) => prev.map((s) => s._id === selectedId ? { ...s, ...res.data } : s))
      }
      toast.success('Availability saved')
    } catch {
      toast.error('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>

  if (!selectedId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No stylist profile found. Ask an admin to create one for your account.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      {isPrivileged && stylists.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Stylist</label>
          <select
            value={selectedId}
            onChange={(e) => handleStylistChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
          >
            {stylists.map((s) => (
              <option key={s._id} value={s._id}>{s.userId?.name ?? 'Stylist'}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Weekly Schedule</label>
        <div className="space-y-2">
          {DAY_NAMES.map((name, idx) => {
            const active = isActive(idx)
            const entry = schedule.find((e) => e.day === idx)
            return (
              <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${active ? 'border-sage-300 bg-sage-50' : 'border-gray-200 bg-gray-50'}`}>
                <button
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`w-16 flex-shrink-0 px-2 py-1 rounded-md text-xs font-semibold border transition-colors ${
                    active
                      ? 'bg-sage-400 text-white border-sage-400'
                      : 'bg-white text-gray-500 border-gray-300 hover:border-sage-400'
                  }`}
                >
                  {name}
                </button>
                {active ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={entry.start}
                      onChange={(e) => updateTime(idx, 'start', e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
                    />
                    <span className="text-gray-400 text-xs flex-shrink-0">to</span>
                    <input
                      type="time"
                      value={entry.end}
                      onChange={(e) => updateTime(idx, 'end', e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">Day off</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="pt-1">
        <p className="text-xs text-gray-400 mb-3">
          Booking slots are generated automatically from each day's hours. Booked slots are removed from the calendar in real time.
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-sage-400 hover:bg-sage-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {saving ? 'Saving…' : 'Save Availability'}
        </button>
      </div>
    </div>
  )
}

// ── Services Panel (owner / admin only) ─────────────────────────────
const ServicesPanel = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', description: '', priceCents: '', durationMinutes: '', category: 'other' })
  const [saving, setSaving] = useState(false)

  const loadServices = useCallback(() => {
    api.get('/services')
      .then((res) => setServices(res.data))
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadServices() }, [loadServices])

  const startEdit = (s) => {
    setEditingId(s._id)
    setEditForm({ name: s.name, description: s.description ?? '', priceCents: s.priceCents, durationMinutes: s.durationMinutes, category: s.category })
  }

  const saveEdit = async (id) => {
    setSaving(true)
    try {
      await api.put(`/services/${id}`, {
        ...editForm,
        priceCents: Number(editForm.priceCents),
        durationMinutes: Number(editForm.durationMinutes),
      })
      toast.success('Service updated')
      setEditingId(null)
      loadServices()
    } catch {
      toast.error('Failed to update service')
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/services', {
        ...addForm,
        priceCents: Number(addForm.priceCents),
        durationMinutes: Number(addForm.durationMinutes),
      })
      toast.success('Service added')
      setShowAdd(false)
      setAddForm({ name: '', description: '', priceCents: '', durationMinutes: '', category: 'other' })
      loadServices()
    } catch {
      toast.error('Failed to add service')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this service?')) return
    try {
      await api.delete(`/services/${id}`)
      toast.success('Service deactivated')
      loadServices()
    } catch {
      toast.error('Failed to deactivate service')
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Set service durations to control calendar slot lengths.</p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="px-4 py-2 bg-sage-400 hover:bg-sage-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add Service'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-sage-50 rounded-xl p-4 space-y-3 border border-sage-200">
          <h3 className="text-sm font-semibold text-sage-600">New Service</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Service name"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
            <select
              value={addForm.category}
              onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
            >
              {['cut', 'color', 'treatment', 'styling', 'other'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              required
              type="number"
              min="1"
              placeholder="Duration (minutes)"
              value={addForm.durationMinutes}
              onChange={(e) => setAddForm((f) => ({ ...f, durationMinutes: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
            <input
              required
              type="number"
              min="0"
              placeholder="Price (cents, e.g. 4500 = $45)"
              value={addForm.priceCents}
              onChange={(e) => setAddForm((f) => ({ ...f, priceCents: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>
          <input
            placeholder="Description (optional)"
            value={addForm.description}
            onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-sage-400 hover:bg-sage-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? 'Adding…' : 'Add Service'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Duration</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {services.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50">
                {editingId === s._id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-sage-400"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={editForm.durationMinutes}
                        onChange={(e) => setEditForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-sage-400"
                      />
                      <span className="text-xs text-gray-400 ml-1">min</span>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={editForm.priceCents}
                        onChange={(e) => setEditForm((f) => ({ ...f, priceCents: e.target.value }))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-sage-400"
                      />
                      <span className="text-xs text-gray-400 ml-1">¢</span>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-sage-400"
                      >
                        {['cut', 'color', 'treatment', 'styling', 'other'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => saveEdit(s._id)}
                          disabled={saving}
                          className="px-2 py-1 bg-sage-400 text-white text-xs rounded hover:bg-sage-500 disabled:opacity-60 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.durationMinutes} min</td>
                    <td className="px-4 py-3 text-gray-600">${(s.priceCents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{s.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(s)}
                          className="px-2 py-1 bg-sage-50 text-sage-600 text-xs rounded hover:bg-sage-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="px-2 py-1 bg-red-50 text-red-500 text-xs rounded hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No services yet. Add one above.</p>
        )}
      </div>
    </div>
  )
}

// ── Content Editor (owner / admin) ──────────────────────────────────
const SECTION_ORDER = ['Home', 'About', 'Contact', 'Feedback']

const ContentPanel = () => {
  const { refresh } = useContentContext()
  const [schema, setSchema]   = useState([])   // full docs with label/type/section
  const [drafts, setDrafts]   = useState({})   // { key: editedValue }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [activeSection, setActiveSection] = useState('Home')

  useEffect(() => {
    api.get('/content/schema')
      .then((res) => {
        setSchema(res.data)
        const initial = {}
        res.data.forEach((d) => { initial[d.key] = d.value })
        setDrafts(initial)
      })
      .catch(() => toast.error('Failed to load content'))
      .finally(() => setLoading(false))
  }, [])

  const sections = SECTION_ORDER.filter((s) => schema.some((d) => d.section === s))
  const visible  = schema.filter((d) => d.section === activeSection).sort((a, b) => a.order - b.order)

  const handleSave = async () => {
    setSaving(true)
    try {
      // Only send keys that changed
      const changed = {}
      schema.forEach(({ key, value }) => {
        if (drafts[key] !== value) changed[key] = drafts[key]
      })
      if (Object.keys(changed).length === 0) {
        toast('No changes to save', { icon: 'ℹ️' })
        setSaving(false)
        return
      }
      await api.put('/content', changed)
      // Update schema to reflect saved values
      setSchema((prev) => prev.map((d) => key in changed ? { ...d, value: changed[d.key] ?? d.value } : d))
      await refresh()   // re-fetch into ContentContext so pages update live
      toast.success('Content saved')
    } catch {
      toast.error('Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Site Copy Editor</p>
          <p className="text-xs text-gray-400 mt-0.5">Changes go live instantly after saving.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-sage-400 hover:bg-sage-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap -mb-px ${
              activeSection === s ? 'bg-gold-400/20 text-amber-700 border-b-2 border-gold-400' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-5 max-w-2xl">
        {visible.map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              {label}
            </label>
            {type === 'textarea' ? (
              <textarea
                rows={4}
                value={drafts[key] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400 resize-y"
              />
            ) : (
              <input
                type="text"
                value={drafts[key] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
              />
            )}
            {key.includes('stat_') && (
              <p className="text-xs text-gray-400 mt-1">Format: <code>value · label</code> e.g. <code>10+ · Years of experience</code></p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-sage-400 hover:bg-sage-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ── Manager Dashboard ────────────────────────────────────────────────
export const ManagerDashboard = () => {
  const { user } = useAuth()
  const isPrivileged = user?.role === 'admin' || user?.role === 'owner'

  const tabs = ['Today', 'All Bookings', 'Stylists', 'Availability', ...(isPrivileged ? ['Services', 'Content'] : [])]

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
        <div className="flex gap-1 mb-6 border-b border-gray-200 flex-wrap">
          {tabs.map((t) => (
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

        {loading && (tab === 'Today' || tab === 'All Bookings') ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-sage-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'Today' && <TodaySchedule bookings={bookings} />}
            {tab === 'All Bookings' && <BookingsManagement bookings={bookings} onStatusChange={handleStatusChange} />}
            {tab === 'Stylists' && <StylistRoster />}
            {tab === 'Availability' && user && <AvailabilityPanel user={user} />}
            {tab === 'Services' && isPrivileged && <ServicesPanel />}
            {tab === 'Content' && isPrivileged && <ContentPanel />}
          </>
        )}
      </div>
    </div>
  )
}
