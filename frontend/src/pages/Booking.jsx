import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { format, addDays, addMinutes, parse, isBefore } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../lib/axios'

const FALLBACK_SERVICES = [
  { _id: '1', name: "Women's Haircut",   priceCents: 6500,  durationMinutes: 60,  category: 'cut'       },
  { _id: '2', name: "Men's Haircut",     priceCents: 3500,  durationMinutes: 30,  category: 'cut'       },
  { _id: '3', name: 'Blowout',           priceCents: 4500,  durationMinutes: 45,  category: 'styling'   },
  { _id: '4', name: 'Full Color',        priceCents: 12000, durationMinutes: 120, category: 'color'     },
  { _id: '5', name: 'Highlights',        priceCents: 15000, durationMinutes: 150, category: 'color'     },
  { _id: '6', name: 'Balayage',          priceCents: 18000, durationMinutes: 180, category: 'color'     },
  { _id: '7', name: 'Deep Conditioning', priceCents: 4000,  durationMinutes: 30,  category: 'treatment' },
  { _id: '8', name: 'Keratin Treatment', priceCents: 25000, durationMinutes: 180, category: 'treatment' },
]

const STEPS = ['Services', 'Date & Stylist', 'Confirm']

const fmtDuration = (min) =>
  min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `${min}m`

const buildAllSlots = (stylist, durationMinutes, date) => {
  const base = new Date(date)
  const start = parse(stylist.workingHours.start, 'HH:mm', base)
  const end   = parse(stylist.workingHours.end,   'HH:mm', base)
  const slots = []
  let cursor = start
  while (
    isBefore(addMinutes(cursor, durationMinutes), end) ||
    addMinutes(cursor, durationMinutes).getTime() === end.getTime()
  ) {
    slots.push(format(cursor, 'HH:mm'))
    cursor = addMinutes(cursor, durationMinutes)
  }
  return slots
}

// ── Step indicator ──────────────────────────────────────────────────────────
const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {STEPS.map((label, i) => (
      <div key={label} className="flex items-center">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          i === current ? 'bg-sage-500 text-white' : i < current ? 'bg-sage-600/40 text-sage-300' : 'bg-white/10 text-sage-500'
        }`}>
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
            i === current ? 'bg-white text-sage-500' : i < current ? 'bg-sage-400 text-white' : 'bg-white/20 text-sage-500'
          }`}>
            {i < current ? '✓' : i + 1}
          </span>
          {label}
        </div>
        {i < STEPS.length - 1 && (
          <div className={`w-6 h-px mx-1 ${i < current ? 'bg-sage-400' : 'bg-white/20'}`} />
        )}
      </div>
    ))}
  </div>
)

// ── Step 1: Service selection + add-ons ────────────────────────────────────
const StepService = ({ services, selected, addOns, onSelect, onToggleAddOn, onNext }) => {
  const addOnOptions = services.filter((s) => s._id !== selected?._id)
  const totalPrice    = (selected?.priceCents ?? 0) + addOns.reduce((s, a) => s + a.priceCents, 0)
  const totalDuration = (selected?.durationMinutes ?? 0) + addOns.reduce((s, a) => s + a.durationMinutes, 0)

  return (
    <div>
      {/* Primary service */}
      <h2 className="text-base font-semibold text-sage-100 mb-1">Primary Service</h2>
      <p className="text-sage-400/70 text-xs mb-3">Choose the main service for your appointment</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 mb-6">
        {services.map((s) => (
          <button
            key={s._id}
            onClick={() => onSelect(s)}
            className={`text-left p-3 rounded-xl border transition-all ${
              selected?._id === s._id
                ? 'border-gold-400/70 bg-gold-400/10 text-sage-50'
                : 'border-sage-600/30 hover:border-sage-400/50 bg-[#0d1a0f]/60 text-sage-200'
            }`}
          >
            <div className="font-medium text-sm">{s.name}</div>
            <div className="text-xs mt-0.5 text-sage-400">
              {fmtDuration(s.durationMinutes)}&nbsp;·&nbsp;
              <span className="text-gold-400 font-semibold">${(s.priceCents / 100).toFixed(0)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Add-on services */}
      {selected && addOnOptions.length > 0 && (
        <>
          <div className="border-t border-sage-600/20 pt-5 mb-4">
            <h2 className="text-base font-semibold text-sage-100 mb-1">Add Services</h2>
            <p className="text-sage-400/70 text-xs mb-3">
              Optionally stack additional services onto your appointment
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {addOnOptions.map((s) => {
                const active = addOns.some((a) => a._id === s._id)
                return (
                  <button
                    key={s._id}
                    onClick={() => onToggleAddOn(s)}
                    className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2 ${
                      active
                        ? 'border-sage-400/60 bg-sage-600/20 text-sage-50'
                        : 'border-sage-600/30 hover:border-sage-400/40 bg-[#0d1a0f]/60 text-sage-300'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center text-xs ${
                      active ? 'bg-sage-400 border-sage-400 text-white' : 'border-sage-500/50'
                    }`}>
                      {active && '✓'}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs mt-0.5 text-sage-400">
                        +{fmtDuration(s.durationMinutes)}&nbsp;·&nbsp;
                        <span className="text-gold-400 font-semibold">+${(s.priceCents / 100).toFixed(0)}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Totals + continue */}
      {selected && (
        <div className="border-t border-sage-600/20 pt-4">
          <div className="flex justify-between text-xs text-sage-400 mb-1">
            <span>
              {1 + addOns.length} service{addOns.length ? 's' : ''}
            </span>
            <span>{fmtDuration(totalDuration)} total</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sage-300 text-sm">Estimated total</span>
            <span className="text-gold-400 font-bold text-lg">${(totalPrice / 100).toFixed(0)}</span>
          </div>
          <button
            onClick={onNext}
            className="w-full py-2.5 bg-sage-500 hover:bg-sage-400 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Continue to Date & Stylist
          </button>
        </div>
      )}

      {!selected && (
        <p className="text-center text-sage-500/60 text-xs pt-2">Select a primary service to continue</p>
      )}
    </div>
  )
}

// ── Step 2: Date, stylist, time ─────────────────────────────────────────────
const StepDateTime = ({ totalDuration, primaryService, stylists, selection, onUpdate, onNext, onBack }) => {
  const [availableSlots, setAvailableSlots] = useState([])
  const [allSlots, setAllSlots]             = useState([])
  const [loadingSlots, setLoadingSlots]     = useState(false)

  const selectedStylist = stylists.find((s) => s._id === selection.stylistId)
  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1))

  const isWorkingDay = (d) => {
    if (!selectedStylist) return true
    return selectedStylist.workingDays.includes(d.getDay())
  }

  useEffect(() => {
    if (!selection.date || !selection.stylistId || !selectedStylist) {
      setAvailableSlots([])
      setAllSlots([])
      return
    }
    const all = buildAllSlots(selectedStylist, totalDuration, selection.date)
    setAllSlots(all)
    setLoadingSlots(true)
    api.get(`/stylists/${selection.stylistId}/availability`, {
      params: { date: format(selection.date, 'yyyy-MM-dd'), serviceId: primaryService._id },
    })
      .then((res) => setAvailableSlots(res.data))
      .catch(() => setAvailableSlots(all))
      .finally(() => setLoadingSlots(false))
  }, [selection.date, selection.stylistId, primaryService._id, totalDuration, selectedStylist])

  const handleDateClick = (d) => {
    if (!isWorkingDay(d)) return
    onUpdate({ date: d, timeSlot: null })
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-sage-100 mb-4">Pick a Date & Stylist</h2>

      {/* Stylist */}
      <div className="mb-5">
        <p className="text-xs font-medium text-sage-400 mb-2">Select Stylist</p>
        {stylists.length === 0 ? (
          <p className="text-xs text-sage-500 italic">No stylists available yet — check back soon!</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {stylists.map((st) => {
              const name = st.userId?.name ?? 'Stylist'
              const isSelected = selection.stylistId === st._id
              return (
                <button
                  key={st._id}
                  onClick={() => onUpdate({ stylistId: st._id, date: null, timeSlot: null })}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-gold-400/60 bg-gold-400/10 text-sage-100'
                      : 'border-sage-600/30 hover:border-sage-400/50 bg-[#0d1a0f]/60 text-sage-300'
                  }`}
                >
                  {name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Date */}
      <div className="mb-5">
        <p className="text-xs font-medium text-sage-400 mb-2">Select Date</p>
        {selectedStylist && (
          <p className="text-xs text-sage-500/70 mb-2">
            Works: {['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
              .filter((_, i) => selectedStylist.workingDays.includes(i)).join(', ')}
          </p>
        )}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dates.map((d) => {
            const working = isWorkingDay(d)
            const isSelected = selection.date && format(d, 'yyyy-MM-dd') === format(selection.date, 'yyyy-MM-dd')
            return (
              <button
                key={d.toISOString()}
                onClick={() => handleDateClick(d)}
                disabled={!working}
                className={`flex-shrink-0 flex flex-col items-center p-2 rounded-xl border w-14 transition-all ${
                  !working
                    ? 'border-sage-600/10 bg-[#0d1a0f]/40 opacity-30 cursor-not-allowed'
                    : isSelected
                    ? 'border-gold-400/60 bg-gold-400/10'
                    : 'border-sage-600/30 hover:border-sage-400/50 bg-[#0d1a0f]/60 cursor-pointer'
                }`}
              >
                <span className="text-xs text-sage-400">{format(d, 'EEE')}</span>
                <span className={`text-lg font-bold ${working ? 'text-sage-100' : 'text-sage-600'}`}>
                  {format(d, 'd')}
                </span>
                <span className="text-xs text-sage-500">{format(d, 'MMM')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      {selection.date && selection.stylistId && (
        <div className="mb-5">
          <p className="text-xs font-medium text-sage-400 mb-2">Available Times</p>
          {loadingSlots ? (
            <div className="flex gap-2 flex-wrap">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-8 w-16 bg-sage-600/20 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : allSlots.length === 0 ? (
            <p className="text-xs text-sage-500 italic">No slots available for this day.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {allSlots.map((slot) => {
                  const isAvailable = availableSlots.includes(slot)
                  const isSelected  = selection.timeSlot === slot
                  return (
                    <button
                      key={slot}
                      onClick={() => isAvailable && onUpdate({ timeSlot: slot })}
                      disabled={!isAvailable}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        !isAvailable
                          ? 'border-sage-600/10 bg-[#0d1a0f]/40 text-sage-600 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-sage-500 text-white border-sage-500'
                          : 'border-sage-600/30 hover:border-sage-400/50 bg-[#0d1a0f]/60 text-sage-300'
                      }`}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
              {availableSlots.length === 0 && (
                <p className="text-xs text-red-400/80 mt-2 italic">
                  All slots are booked for this day — please choose another date.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="mb-5">
        <p className="text-xs font-medium text-sage-400 mb-2">Notes (optional)</p>
        <textarea
          value={selection.notes ?? ''}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Any requests or things we should know..."
          rows={2}
          className="w-full px-3 py-2 border border-sage-600/30 bg-[#0d1a0f]/60 rounded-xl text-sm text-sage-100 placeholder-sage-600 focus:outline-none focus:border-sage-400/60 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 border border-sage-600/30 text-sage-400 font-medium rounded-xl hover:border-sage-400/50 transition-colors text-sm"
        >
          Back
        </button>
        <button
          disabled={!selection.date || !selection.stylistId || !selection.timeSlot}
          onClick={onNext}
          className="flex-1 py-2.5 bg-sage-500 hover:bg-sage-400 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          Review Booking
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Confirm ─────────────────────────────────────────────────────────
const StepConfirm = ({ selection, addOns, stylists, onBack, onConfirm, submitting }) => {
  const { service } = selection
  const stylist = stylists.find((s) => s._id === selection.stylistId)
  const stylistName = stylist?.userId?.name ?? 'Your stylist'
  const totalPrice    = service.priceCents + addOns.reduce((s, a) => s + a.priceCents, 0)
  const totalDuration = service.durationMinutes + addOns.reduce((s, a) => s + a.durationMinutes, 0)

  return (
    <div>
      <h2 className="text-base font-semibold text-sage-100 mb-4">Confirm Your Booking</h2>

      <div className="rounded-xl border border-sage-600/25 bg-[#0d1a0f]/60 p-5 mb-5 space-y-3">
        {/* Services */}
        <div>
          <span className="text-sage-500 text-xs block mb-1.5">Services</span>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-sage-100">{service.name}</span>
              <span className="text-gold-400 font-semibold">${(service.priceCents / 100).toFixed(0)}</span>
            </div>
            {addOns.map((a) => (
              <div key={a._id} className="flex justify-between text-sm">
                <span className="text-sage-300">+ {a.name}</span>
                <span className="text-gold-400/80">+${(a.priceCents / 100).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-sage-600/20 pt-3 space-y-2">
          <Row label="Total duration" value={fmtDuration(totalDuration)} />
          <Row label="Stylist"        value={stylistName} />
          <Row label="Date"           value={format(selection.date, 'EEEE, MMMM d, yyyy')} />
          <Row label="Time"           value={selection.timeSlot} />
          {selection.notes && <Row label="Notes" value={selection.notes} />}
        </div>

        <div className="border-t border-sage-600/20 pt-3 flex justify-between">
          <span className="text-sage-300 text-sm font-medium">Estimated Total</span>
          <span className="text-gold-400 font-bold text-lg">${(totalPrice / 100).toFixed(0)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 border border-sage-600/30 text-sage-400 font-medium rounded-xl hover:border-sage-400/50 transition-colors text-sm"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="flex-1 py-2.5 bg-sage-500 hover:bg-sage-400 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          {submitting ? 'Booking…' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  )
}

const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-sage-500">{label}</span>
    <span className="text-sage-100 font-medium">{value}</span>
  </div>
)

// ── Main Booking page ───────────────────────────────────────────────────────
export const Booking = () => {
  const location = useLocation()
  const navigate  = useNavigate()
  const [step, setStep]       = useState(0)
  const [services, setServices] = useState([])
  const [stylists, setStylists] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed]   = useState(null)

  const [selection, setSelection] = useState({
    service:   null,
    addOns:    [],      // additional services
    date:      null,
    stylistId: null,
    timeSlot:  null,
    notes:     '',
  })

  useEffect(() => {
    Promise.all([api.get('/services'), api.get('/stylists')])
      .then(([sRes, stRes]) => {
        const svcs = sRes.data.length ? sRes.data : FALLBACK_SERVICES
        setServices(svcs)
        setStylists(stRes.data)
        const preId = location.state?.serviceId
        if (preId) {
          const pre = svcs.find((s) => s._id === preId)
          if (pre) setSelection((sel) => ({ ...sel, service: pre }))
        }
      })
      .catch(() => setServices(FALLBACK_SERVICES))
  }, [location.state?.serviceId])

  const update = (patch) => setSelection((s) => ({ ...s, ...patch }))

  const toggleAddOn = (service) => {
    setSelection((s) => {
      const already = s.addOns.some((a) => a._id === service._id)
      return {
        ...s,
        addOns: already ? s.addOns.filter((a) => a._id !== service._id) : [...s.addOns, service],
      }
    })
  }

  const totalDuration =
    (selection.service?.durationMinutes ?? 0) +
    selection.addOns.reduce((t, a) => t + a.durationMinutes, 0)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const addOnNote = selection.addOns.length
        ? `Add-on services: ${selection.addOns.map((a) => a.name).join(', ')}.`
        : ''
      const notes = [addOnNote, selection.notes].filter(Boolean).join(' ')

      await api.post('/bookings', {
        serviceId: selection.service._id,
        stylistId: selection.stylistId,
        date:      format(selection.date, 'yyyy-MM-dd'),
        startTime: selection.timeSlot,
        notes,
      })
      setConfirmed(true)
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
        <div className="rounded-2xl border border-sage-600/25 bg-[#111f13]/90 shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-5">🎉</div>
          <h2 className="text-2xl font-light text-sage-50 mb-2">You're booked!</h2>
          <p className="text-sage-400/70 text-sm mb-7">
            We'll see you on {format(selection.date, 'MMMM d')} at {selection.timeSlot}.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-2.5 bg-sage-500 hover:bg-sage-400 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-10">
      <div className="rounded-2xl border border-sage-600/25 bg-[#111f13]/90 shadow-2xl w-full max-w-xl p-8">
        <h1 className="text-xl font-light text-center text-sage-100 mb-1">Book an Appointment</h1>
        <p className="text-center text-sage-500/60 text-xs mb-6">Styles by Maggie</p>

        <StepIndicator current={step} />

        {step === 0 && (
          <StepService
            services={services}
            selected={selection.service}
            addOns={selection.addOns}
            onSelect={(s) => update({ service: s, addOns: [] })}
            onToggleAddOn={toggleAddOn}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepDateTime
            totalDuration={totalDuration}
            primaryService={selection.service}
            stylists={stylists}
            selection={selection}
            onUpdate={update}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepConfirm
            selection={selection}
            addOns={selection.addOns}
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
