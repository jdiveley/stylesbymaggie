import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../lib/axios'

// ── Stats Overview ──────────────────────────────────────────────────
const StatsOverview = ({ stats }) => {
  if (!stats) return <div className="text-gray-500 text-sm">Loading stats…</div>
  const revenue = `$${((stats.revenueCents ?? 0) / 100).toFixed(2)}`
  const cards = [
    { label: 'Total Bookings', value: stats.totalBookings ?? 0, icon: '📅' },
    { label: 'Pending', value: stats.pendingBookings ?? 0, icon: '⏳' },
    { label: 'Completed', value: stats.completedBookings ?? 0, icon: '✅' },
    { label: 'Revenue', value: revenue, icon: '💰' },
    { label: 'Customers', value: stats.totalCustomers ?? 0, icon: '👥' },
    { label: 'Services', value: stats.totalServices ?? 0, icon: '✂️' },
  ]
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {cards.map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>
      {stats.topServices?.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">Top Services</h3>
          <div className="space-y-2">
            {stats.topServices.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">#{i + 1} {s.name}</span>
                <span className="font-semibold text-gold-400">{s.count} bookings</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Services CRUD ────────────────────────────────────────────────────
const CATEGORIES = ['cut', 'color', 'treatment', 'styling', 'other']

const ServicesPanel = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | service object
  const [form, setForm] = useState({ name: '', description: '', priceCents: '', durationMinutes: '', category: 'cut' })

  const load = useCallback(async () => {
    try {
      const res = await api.get('/services')
      setServices(res.data)
    } catch { toast.error('Failed to load services') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setForm({ name: '', description: '', priceCents: '', durationMinutes: '', category: 'cut' })
    setEditing('new')
  }
  const openEdit = (s) => {
    setForm({ name: s.name, description: s.description ?? '', priceCents: s.priceCents / 100, durationMinutes: s.durationMinutes, category: s.category })
    setEditing(s)
  }

  const save = async () => {
    try {
      const payload = { ...form, priceCents: Math.round(Number(form.priceCents) * 100), durationMinutes: Number(form.durationMinutes) }
      if (editing === 'new') {
        await api.post('/services', payload)
        toast.success('Service created')
      } else {
        await api.put(`/services/${editing._id}`, payload)
        toast.success('Service updated')
      }
      setEditing(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message ?? 'Save failed') }
  }

  const remove = async (id) => {
    if (!confirm('Deactivate this service?')) return
    try {
      await api.delete(`/services/${id}`)
      toast.success('Service deactivated')
      load()
    } catch { toast.error('Failed to deactivate') }
  }

  if (editing) return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 max-w-lg">
      <h3 className="font-semibold text-gray-700 mb-4">{editing === 'new' ? 'New Service' : 'Edit Service'}</h3>
      <div className="space-y-3">
        {[['Name', 'name', 'text'], ['Description', 'description', 'text'], ['Price ($)', 'priceCents', 'number'], ['Duration (min)', 'durationMinutes', 'number']].map(([label, key, type]) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>
        ))}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => setEditing(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={save} className="flex-1 py-2 bg-sage-400 hover:bg-sage-500 text-white rounded-lg text-sm font-semibold">Save</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">Services</h3>
        <button onClick={openNew} className="px-4 py-1.5 bg-sage-400 hover:bg-sage-500 text-white text-sm font-semibold rounded-lg">+ Add Service</button>
      </div>
      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Duration</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 capitalize text-gray-500">{s.category}</td>
                  <td className="px-4 py-3 text-right text-gray-700">${(s.priceCents / 100).toFixed(0)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{s.durationMinutes}m</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(s)} className="text-blue-500 hover:underline mr-3 text-xs">Edit</button>
                    <button onClick={() => remove(s._id)} className="text-red-400 hover:underline text-xs">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Bookings Panel ───────────────────────────────────────────────────
const BookingsPanel = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await api.get('/bookings', { params: statusFilter ? { status: statusFilter } : {} })
      setBookings(res.data)
    } catch { toast.error('Failed to load bookings') }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status })
      toast.success('Status updated')
      load()
    } catch { toast.error('Update failed') }
  }

  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
    'no-show': 'bg-gray-100 text-gray-600',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">All Bookings</h3>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400">
          <option value="">All Statuses</option>
          {['pending','confirmed','completed','cancelled','no-show'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : bookings.length === 0 ? (
        <p className="text-gray-400 text-sm italic">No bookings found.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{b.customerId?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{b.serviceId?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(b.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-500">{b.startTime}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] ?? ''}`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={b.status}
                        onChange={(e) => updateStatus(b._id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-900 bg-white focus:outline-none"
                      >
                        {['pending','confirmed','completed','cancelled','no-show'].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Users Panel ──────────────────────────────────────────────────────
const UsersPanel = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const changeRole = async (id, role) => {
    try {
      await api.put(`/users/${id}/role`, { role })
      toast.success('Role updated')
      load()
    } catch { toast.error('Update failed') }
  }

  const ROLE_COLORS = { admin: 'bg-purple-100 text-purple-700', owner: 'bg-gold-400/20 text-yellow-700', stylist: 'bg-blue-100 text-blue-700', customer: 'bg-gray-100 text-gray-600' }

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-4">Users</h3>
      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Change Role</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? ''}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u._id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-900 bg-white focus:outline-none"
                    >
                      <option value="customer">customer</option>
                      <option value="stylist">stylist</option>
                      <option value="owner">owner</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Stylists Panel ───────────────────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const BLANK_STYLIST_FORM = {
  // user fields
  mode: 'new', // 'new' | 'existing'
  existingUserId: '',
  name: '', username: '', email: '', password: '',
  // profile fields
  bio: '', specialties: '',
  workingDays: [1, 2, 3, 4, 5],
  startTime: '09:00', endTime: '17:00',
}

const StylistsPanel = () => {
  const [stylists, setStylists] = useState([])
  const [users, setUsers] = useState([]) // users without a stylist profile
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK_STYLIST_FORM)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const loadData = useCallback(async () => {
    try {
      const [stRes, uRes] = await Promise.all([api.get('/stylists'), api.get('/users')])
      setStylists(stRes.data)
      // Users who don't already have a stylist profile
      const stylistUserIds = new Set(stRes.data.map((s) => s.userId?._id))
      setUsers(uRes.data.filter((u) => !stylistUserIds.has(u._id)))
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const toggleDay = (day, days, setDays) => {
    setDays(days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b))
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let userId = form.existingUserId
      if (form.mode === 'new') {
        const uRes = await api.post('/users', {
          name: form.name,
          username: form.username || undefined,
          email: form.email || undefined,
          password: form.password,
          role: 'stylist',
        })
        userId = uRes.data._id
      }
      await api.post('/stylists', {
        userId,
        bio: form.bio,
        specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
        workingDays: form.workingDays,
        workingHours: { start: form.startTime, end: form.endTime },
      })
      toast.success('Stylist added')
      setShowForm(false)
      setForm(BLANK_STYLIST_FORM)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to add stylist')
    } finally { setSaving(false) }
  }

  const startEdit = (s) => {
    setEditingId(s._id)
    setEditForm({
      bio: s.bio ?? '',
      specialties: (s.specialties ?? []).join(', '),
      workingDays: [...s.workingDays],
      startTime: s.workingHours.start,
      endTime: s.workingHours.end,
    })
  }

  const saveEdit = async (id) => {
    setSaving(true)
    try {
      await api.put(`/stylists/${id}`, {
        bio: editForm.bio,
        specialties: editForm.specialties.split(',').map((s) => s.trim()).filter(Boolean),
        workingDays: editForm.workingDays,
        workingHours: { start: editForm.startTime, end: editForm.endTime },
      })
      toast.success('Stylist updated')
      setEditingId(null)
      loadData()
    } catch { toast.error('Failed to update stylist') }
    finally { setSaving(false) }
  }

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this stylist profile?')) return
    try {
      await api.delete(`/stylists/${id}`)
      toast.success('Stylist deactivated')
      loadData()
    } catch { toast.error('Failed to deactivate stylist') }
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{stylists.length} active stylist{stylists.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => { setShowForm((v) => !v); setForm(BLANK_STYLIST_FORM) }}
          className="px-4 py-2 bg-sage-400 hover:bg-sage-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Stylist'}
        </button>
      </div>

      {/* Add stylist form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-sage-50 border border-sage-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sage-600">New Stylist</h3>

          {/* Mode toggle */}
          <div className="flex gap-2">
            {['new', 'existing'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForm((f) => ({ ...f, mode: m }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.mode === m ? 'bg-sage-400 text-white border-sage-400' : 'bg-white text-gray-600 border-gray-300 hover:border-sage-400'
                }`}
              >
                {m === 'new' ? 'Create new account' : 'Link existing user'}
              </button>
            ))}
          </div>

          {form.mode === 'new' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400" />
              <input placeholder="Username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400" />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400" />
              <input required type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400" />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Select existing user</label>
              <select required value={form.existingUserId} onChange={(e) => setForm((f) => ({ ...f, existingUserId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400">
                <option value="">— choose a user —</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email ?? u.username})</option>
                ))}
              </select>
              {users.length === 0 && <p className="text-xs text-gray-400 mt-1">All users already have stylist profiles.</p>}
            </div>
          )}

          <div className="border-t border-sage-200 pt-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stylist Profile</p>
            <textarea placeholder="Bio (optional)" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none" />
            <input placeholder="Specialties (comma-separated)" value={form.specialties} onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400" />
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Working Days</p>
              <div className="flex gap-2 flex-wrap">
                {DAY_NAMES.map((name, idx) => (
                  <button key={idx} type="button"
                    onClick={() => toggleDay(idx, form.workingDays, (days) => setForm((f) => ({ ...f, workingDays: days })))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      form.workingDays.includes(idx) ? 'bg-sage-400 text-white border-sage-400' : 'bg-white text-gray-600 border-gray-300 hover:border-sage-400'
                    }`}
                  >{name}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Start Time</label>
                <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">End Time</label>
                <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="px-5 py-2 bg-sage-400 hover:bg-sage-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
            {saving ? 'Adding…' : 'Add Stylist'}
          </button>
        </form>
      )}

      {/* Stylist list */}
      {stylists.length === 0 && !showForm ? (
        <p className="text-center text-gray-400 text-sm py-8">No stylists yet — add one above.</p>
      ) : (
        <div className="space-y-3">
          {stylists.map((s) => (
            <div key={s._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              {editingId === s._id ? (
                <div className="space-y-3">
                  <p className="font-semibold text-gray-800">{s.userId?.name}</p>
                  <textarea placeholder="Bio" value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none" />
                  <input placeholder="Specialties (comma-separated)" value={editForm.specialties} onChange={(e) => setEditForm((f) => ({ ...f, specialties: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400" />
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Working Days</p>
                    <div className="flex gap-2 flex-wrap">
                      {DAY_NAMES.map((name, idx) => (
                        <button key={idx} type="button"
                          onClick={() => toggleDay(idx, editForm.workingDays, (days) => setEditForm((f) => ({ ...f, workingDays: days })))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            editForm.workingDays.includes(idx) ? 'bg-sage-400 text-white border-sage-400' : 'bg-white text-gray-600 border-gray-300 hover:border-sage-400'
                          }`}
                        >{name}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Start Time</label>
                      <input type="time" value={editForm.startTime} onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">End Time</label>
                      <input type="time" value={editForm.endTime} onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(s._id)} disabled={saving}
                      className="px-4 py-1.5 bg-sage-400 hover:bg-sage-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="px-4 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center text-sage-500 font-bold text-lg flex-shrink-0">
                      {(s.userId?.name ?? 'S')[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{s.userId?.name ?? 'Stylist'}</div>
                      <div className="text-xs text-gray-500">{s.userId?.email}</div>
                      {s.bio && <p className="text-sm text-gray-500 mt-1">{s.bio}</p>}
                      {s.specialties?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.specialties.map((sp) => (
                            <span key={sp} className="px-2 py-0.5 bg-sage-50 text-sage-500 text-xs rounded-full">{sp}</span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {s.workingDays.map((d) => DAY_NAMES[d]).join(', ')} &middot; {s.workingHours.start}–{s.workingHours.end}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(s)}
                      className="px-3 py-1.5 bg-sage-50 text-sage-600 text-xs font-medium rounded-lg hover:bg-sage-100 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDeactivate(s._id)}
                      className="px-3 py-1.5 bg-red-50 text-red-500 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors">
                      Deactivate
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Admin Dashboard ──────────────────────────────────────────────────
const TABS = ['Overview', 'Services', 'Bookings', 'Users', 'Stylists']

export const AdminDashboard = () => {
  const [tab, setTab] = useState('Overview')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/stats').then((res) => setStats(res.data)).catch(() => {})
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white drop-shadow mb-6">Admin Dashboard</h1>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 pb-0 flex-wrap">
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
        {tab === 'Overview' && <StatsOverview stats={stats} />}
        {tab === 'Services' && <ServicesPanel />}
        {tab === 'Bookings' && <BookingsPanel />}
        {tab === 'Users' && <UsersPanel />}
        {tab === 'Stylists' && <StylistsPanel />}
      </div>
    </div>
  )
}
