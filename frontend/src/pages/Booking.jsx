import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { format, addDays, isToday, isBefore, startOfDay } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../lib/axios'

const FALLBACK_SERVICES = [
  { _id: '1', name: "Women's Haircut", priceCents: 6500, durationMinutes: 60, category: 'cut' },
  { _id: '2', name: "Men's Haircut", priceCents: 3500, durationMinutes: 30, category: 'cut' },
  { _id: '3', name: 'Blowout', priceCents: 4500, durationMinutes: 45, category: 'styling' },
  { _id: '4', name: 'Full Color', priceCents: 12000, durationMinutes: 120, category: 'color' },
  { _id: '5', name: 'Highlights', priceCents: 15000, durationMinutes: 150, category: 'color' },
  { _id: '6', name: 'Balayage', priceCents: 18000, durationMinutes: 180, category: 'color' },
  { _id: '7', name: 'Deep Conditioning', priceCents: 4000, durationMinutes: 30, category: 'treatment' },
  { _id: '8', name: 'Keratin Treatment', priceCents: 25000, durationMinutes: 180, category: 'treatment' },
]

const STEPS = ['Select Service', 'Date & Stylist', 'Confirm']

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {STEPS.map((label, i) => (
      <div key={label} className="flex items-center">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          i === current ? 'bg-sage-400 text-white' : i < current ? 'bg-sage-100 text-sage-500' : 'bg-white/60 text-gray-400'
        }`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
            i === current ? 'bg-white text-sage-400' : i < current ? 'bg-sage-400 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {i < current ? '✓' : i + 1}
          </span>
          {label}
        </div>
        {i < STEPS.length - 1 && <div className={`w-6 h-px mx-1 ${i < current ? 'bg-sage-400' : 'bg-gray-300'}`} />}
      </div>
    ))}
  </div>
)

// Step 1: Select Service
const StepService = ({ services, selected, onSelect, onNext }) => (
  <div>
    <h2 className="text-xl font-bold text-gray-800 mb-4">Choose a Service</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
      {services.map((s) => (
        <button
          key={s._id}
          onClick={() => onSelect(s)}
          className={`text-left p-4 rounded-xl border-2 transition-all ${
            selected?._id === s._id
              ? 'border-sage-400 bg-sage-50'
              : 'border-gray-200 hover:border-sage-200 bg-white'
          }`}
        >
          <div className="font-semibold text-gray-800">{s.name}</div>
          <div className="text-sm text-gray-500 mt-0.5">
            {s.durationMinutes >= 60
              ? `${Math.floor(s.durationMinutes / 60)}h${s.durationMinutes % 60 ? ' ' + s.durationMinutes % 60 + 'm' : ''}`
              : `${s.durationMinutes}m`} &middot; <span className="text-gold-400 font-semibold">${(s.priceCents / 100).toFixed(0)}</span>
          </div>
        </button>
      ))}
    </div>
    <button
      disabled={!selected}
      onClick={onNext}
      className="mt-6 w-full py-2.5 bg-sage-400 hover:bg-sage-500 disabled:opacity-40 text-white font-semibold rounded-lg transition-colors"
    >
      Continue
    </button>
  </div>
)

// Step 2: Date & Stylist & Time
const StepDateTime = ({ service, stylists, selection, onUpdate, onNext, onBack }) => {
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1))

  useEffect(() => {
    if (!selection.date || !selection.stylistId) { setSlots([]); return }
    setLoadingSlots(true)
    api.get(`/stylists/${selection.stylistId}/availability`, {
      params: { date: format(selection.date, 'yyyy-MM-dd'), serviceId: service._id },
    })
      .then((res) => setSlots(res.data))
      .catch(() => setSlots(['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30','16:00']))
      .finally(() => setLoadingSlots(false))
  }, [selection.date, selection.stylistId, service._id])

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Pick a Date & Stylist</h2>

      {/* Date picker */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-600 mb-2">Select Date</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dates.map((d) => {
            const selected = selection.date && format(d, 'yyyy-MM-dd') === format(selection.date, 'yyyy-MM-dd')
            return (
              <button
                key={d.toISOString()}
                onClick={() => onUpdate({ date: d, timeSlot: null })}
                className={`flex-shrink-0 flex flex-col items-center p-2 rounded-xl border-2 w-14 transition-all ${
                  selected ? 'border-sage-400 bg-sage-50' : 'border-gray-200 hover:border-sage-200 bg-white'
                }`}
              >
                <span className="text-xs text-gray-500">{format(d, 'EEE')}</span>
                <span className="text-lg font-bold text-gray-800">{format(d, 'd')}</span>
                <span className="text-xs text-gray-400">{format(d, 'MMM')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stylist picker */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-600 mb-2">Select Stylist</p>
        {stylists.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No stylists available yet — check back soon!</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {stylists.map((st) => {
              const name = st.userId?.name ?? 'Stylist'
              const selected = selection.stylistId === st._id
              return (
                <button
                  key={st._id}
                  onClick={() => onUpdate({ stylistId: st._id, timeSlot: null })}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    selected ? 'border-sage-400 bg-sage-50 text-sage-600' : 'border-gray-200 hover:border-sage-200 bg-white text-gray-700'
                  }`}
                >
                  {name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Time slots */}
      {selection.date && selection.stylistId && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600 mb-2">Available Times</p>
          {loadingSlots ? (
            <div className="flex gap-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-9 w-16 bg-gray-200 rounded-lg animate-pulse" />)}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No availability for this date — try another day.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => onUpdate({ timeSlot: slot })}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    selection.timeSlot === slot
                      ? 'bg-sage-400 text-white border-sage-400'
                      : 'bg-white border-gray-200 hover:border-sage-300 text-gray-700'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-600 mb-2">Notes (optional)</p>
        <textarea
          value={selection.notes ?? ''}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Any requests or things to know..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button
          disabled={!selection.date || !selection.stylistId || !selection.timeSlot}
          onClick={onNext}
          className="flex-1 py-2.5 bg-sage-400 hover:bg-sage-500 disabled:opacity-40 text-white font-semibold rounded-lg transition-colors"
        >
          Review Booking
        </button>
      </div>
    </div>
  )
}

// Step 3: Confirm
const StepConfirm = ({ service, selection, stylists, onBack, onConfirm, submitting }) => {
  const stylist = stylists.find((s) => s._id === selection.stylistId)
  const stylistName = stylist?.userId?.name ?? 'Your stylist'

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Your Booking</h2>
      <div className="bg-sage-50 rounded-xl p-5 mb-6 space-y-3">
        <Row label="Service" value={service.name} />
        <Row label="Price" value={`$${(service.priceCents / 100).toFixed(0)}`} />
        <Row label="Duration" value={`${service.durationMinutes} min`} />
        <Row label="Stylist" value={stylistName} />
        <Row label="Date" value={format(selection.date, 'EEEE, MMMM d, yyyy')} />
        <Row label="Time" value={selection.timeSlot} />
        {selection.notes && <Row label="Notes" value={selection.notes} />}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="flex-1 py-2.5 bg-sage-400 hover:bg-sage-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
        >
          {submitting ? 'Booking…' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  )
}

const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-semibold text-gray-800">{value}</span>
  </div>
)

export const Booking = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [services, setServices] = useState([])
  const [stylists, setStylists] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(null)

  const [selection, setSelection] = useState({
    service: null,
    date: null,
    stylistId: null,
    timeSlot: null,
    notes: '',
  })

  useEffect(() => {
    Promise.all([api.get('/services'), api.get('/stylists')])
      .then(([sRes, stRes]) => {
        const svcs = sRes.data.length ? sRes.data : FALLBACK_SERVICES
        setServices(svcs)
        setStylists(stRes.data)
        // Pre-select service if passed via navigation state
        const preId = location.state?.serviceId
        if (preId) {
          const pre = svcs.find((s) => s._id === preId)
          if (pre) setSelection((sel) => ({ ...sel, service: pre }))
        }
      })
      .catch(() => setServices(FALLBACK_SERVICES))
  }, [location.state?.serviceId])

  const update = (patch) => setSelection((s) => ({ ...s, ...patch }))

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const res = await api.post('/bookings', {
        serviceId: selection.service._id,
        stylistId: selection.stylistId,
        date: format(selection.date, 'yyyy-MM-dd'),
        startTime: selection.timeSlot,
        notes: selection.notes,
      })
      setConfirmed(res.data)
      toast.success('Booking confirmed!')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Booking failed — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmed) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">You're booked!</h2>
          <p className="text-gray-500 mb-6">We'll see you on {format(selection.date, 'MMMM d')} at {selection.timeSlot}.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-sage-400 hover:bg-sage-500 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-10">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl w-full max-w-xl p-8">
        <h1 className="text-2xl font-bold text-center text-sage-400 mb-6">Book an Appointment</h1>
        <StepIndicator current={step} />

        {step === 0 && (
          <StepService
            services={services}
            selected={selection.service}
            onSelect={(s) => update({ service: s })}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepDateTime
            service={selection.service}
            stylists={stylists}
            selection={selection}
            onUpdate={update}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepConfirm
            service={selection.service}
            selection={selection}
            stylists={stylists}
            onBack={() => setStep(1)}
            onConfirm={handleConfirm}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  )
}
