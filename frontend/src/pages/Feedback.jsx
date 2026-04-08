import { useState } from 'react'
import { useContent } from '../context/ContentContext'

const RATINGS = [1, 2, 3, 4, 5]

export const Feedback = () => {
  const heading   = useContent('feedback_heading',  'Share Your Experience')
  const intro     = useContent('feedback_intro',    'Your feedback helps us grow.')
  const thankyou  = useContent('feedback_thankyou', 'Thank you for your feedback!')

  const [rating, setRating]     = useState(0)
  const [hovered, setHovered]   = useState(0)
  const [form, setForm]         = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) return
    setLoading(true)
    // Placeholder — wire to a real endpoint or email service later
    await new Promise((r) => setTimeout(r, 600))
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="rounded-2xl border border-sage-600/25 bg-[#111f13]/90 shadow-2xl max-w-md w-full p-10 text-center">
          <div className="text-5xl mb-5">🌿</div>
          <h2 className="text-2xl font-light text-sage-50 mb-4">{heading}</h2>
          <p className="text-sage-300/70 text-sm leading-relaxed">{thankyou}</p>
          <div className="flex justify-center gap-1 mt-6">
            {RATINGS.map((r) => (
              <span key={r} className={`text-2xl ${r <= rating ? 'text-gold-400' : 'text-sage-700'}`}>★</span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-16 px-6">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-10 bg-gold-400/50" />
            <span className="text-gold-400/70 text-xs tracking-[0.25em] uppercase font-medium">Feedback</span>
          </div>
          <h1 className="text-4xl font-light text-sage-50 mb-4">{heading}</h1>
          <p className="text-sage-300/65 text-sm leading-relaxed">{intro}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Star rating */}
          <div>
            <label className="block text-xs font-medium text-sage-400 mb-3 tracking-wide uppercase">
              Your Rating <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating(r)}
                  onMouseEnter={() => setHovered(r)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-3xl transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${r} stars`}
                >
                  <span className={(hovered || rating) >= r ? 'text-gold-400' : 'text-sage-700'}>★</span>
                </button>
              ))}
            </div>
            {!rating && <p className="text-sage-600/60 text-xs mt-2">Select a rating to continue</p>}
          </div>

          {/* Name */}
          <Field label="Name" required>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              maxLength={100}
              className={inputCls}
            />
          </Field>

          {/* Email */}
          <Field label="Email" hint="Optional — only if you'd like a response">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              maxLength={200}
              className={inputCls}
            />
          </Field>

          {/* Message */}
          <Field label="Your Feedback" required>
            <textarea
              name="message"
              required
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us about your visit..."
              rows={5}
              maxLength={2000}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <button
            type="submit"
            disabled={!rating || loading}
            className="w-full py-3 bg-sage-500 hover:bg-sage-400 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            {loading ? 'Sending…' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-4 py-2.5 border border-gray-300 bg-white rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400'

const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-xs font-medium text-sage-400 mb-1.5 tracking-wide">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && <p className="text-sage-600/60 text-xs mt-1">{hint}</p>}
  </div>
)
