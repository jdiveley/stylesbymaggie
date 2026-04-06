import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export const Login = () => {
  const { login, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/'

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', identifier: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = mode === 'login'
        ? await login(form.identifier, form.password)
        : await register(form.name, form.email, form.password)
      toast.success(`Welcome${user.name ? ', ' + user.name : ''}!`)
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async ({ credential }) => {
    try {
      const user = await loginWithGoogle(credential)
      toast.success(`Welcome, ${user.name}!`)
      navigate(from, { replace: true })
    } catch {
      toast.error('Google sign-in failed')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center text-sage-400 mb-2">Styles by Maggie</h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
        </p>

        {/* Google */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogle}
            onError={() => toast.error('Google sign-in failed')}
            useOneTap={false}
            shape="rectangular"
            size="large"
            width="320"
          />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Local form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
              <input
                name="identifier"
                type="text"
                required
                value={form.identifier}
                onChange={handleChange}
                placeholder="username or you@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sage-400 hover:bg-sage-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-gold-400 font-semibold hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          <Link to="/" className="hover:text-sage-400">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
