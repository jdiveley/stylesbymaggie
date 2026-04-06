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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>
        ))}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400">
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
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400">
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
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
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
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
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

// ── Admin Dashboard ──────────────────────────────────────────────────
const TABS = ['Overview', 'Services', 'Bookings', 'Users']

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
        <div className="flex gap-1 mb-6 border-b border-gray-200 pb-0">
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
      </div>
    </div>
  )
}
