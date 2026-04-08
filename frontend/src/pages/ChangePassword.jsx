import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'

export const ChangePassword = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (form.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await api.put('/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      toast.success('Password updated successfully')
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
      navigate(-1)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  // Google-only accounts have no existing password
  const hasExistingPassword = !user?.googleId || user?.passwordHash

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl w-full max-w-md p-8 text-gray-900">
        <h1 className="text-2xl font-bold text-sage-400 mb-1">Change Password</h1>
        <p className="text-gray-500 text-sm mb-8">
          {user?.name ? `Updating password for ${user.name}` : 'Update your account password'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              name="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm text-gray-900 bg-white placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              name="newPassword"
              type="password"
              required
              minLength={8}
              value={form.newPassword}
              onChange={handleChange}
              placeholder="At least 8 characters"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm text-gray-900 bg-white placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              name="confirm"
              type="password"
              required
              value={form.confirm}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm text-gray-900 bg-white placeholder-gray-400 ${
                form.confirm && form.confirm !== form.newPassword
                  ? 'border-red-400'
                  : 'border-gray-300'
              }`}
            />
            {form.confirm && form.confirm !== form.newPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (form.confirm && form.confirm !== form.newPassword)}
              className="flex-1 py-2.5 bg-sage-400 hover:bg-sage-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
