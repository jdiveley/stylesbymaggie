import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import { useContent } from '../context/ContentContext'
import { BookingGateModal } from '../components/BookingGateModal'

// Curated Unsplash hairstyle photos per service name (lowercase) and category
const SERVICE_PHOTOS = {
  "women's haircut":   "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=420&h=280&q=80",
  "men's haircut":     "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=420&h=280&q=80",
  "blowout":           "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=420&h=280&q=80",
  "full color":        "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=420&h=280&q=80",
  "highlights":        "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=420&h=280&q=80",
  "balayage":          "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=420&h=280&q=80",
  "deep conditioning": "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=420&h=280&q=80",
  "keratin treatment": "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=420&h=280&q=80",
}

const CATEGORY_PHOTOS = {
  cut:       "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=420&h=280&q=80",
  color:     "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=420&h=280&q=80",
  treatment: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=420&h=280&q=80",
  styling:   "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=420&h=280&q=80",
  other:     "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=420&h=280&q=80",
}

const FALLBACK_SERVICES = [
  { _id: '1', name: "Women's Haircut",    description: "Precision cut tailored to your shape and style.",      priceCents: 6500,  durationMinutes: 60,  category: 'cut'       },
  { _id: '2', name: "Men's Haircut",      description: "Clean, sharp cuts for every gentleman.",               priceCents: 3500,  durationMinutes: 30,  category: 'cut'       },
  { _id: '3', name: "Blowout",            description: "Silky smooth finish for any occasion.",                priceCents: 4500,  durationMinutes: 45,  category: 'styling'   },
  { _id: '4', name: "Full Color",         description: "Complete color transformation, root to tip.",          priceCents: 12000, durationMinutes: 120, category: 'color'     },
  { _id: '5', name: "Highlights",         description: "Sun-kissed dimension and brightness.",                 priceCents: 15000, durationMinutes: 150, category: 'color'     },
  { _id: '6', name: "Balayage",           description: "Hand-painted, natural-looking color.",                 priceCents: 18000, durationMinutes: 180, category: 'color'     },
  { _id: '7', name: "Deep Conditioning",  description: "Restore moisture, shine, and strength.",               priceCents: 4000,  durationMinutes: 30,  category: 'treatment' },
  { _id: '8', name: "Keratin Treatment",  description: "Frizz-free, glossy hair that lasts for months.",      priceCents: 25000, durationMinutes: 180, category: 'treatment' },
]

const getPhoto = (service) => {
  const key = service.name.toLowerCase()
  return SERVICE_PHOTOS[key] || CATEGORY_PHOTOS[service.category] || CATEGORY_PHOTOS.cut
}

const ServiceCard = ({ service, onBook }) => (
  <div
    onClick={() => onBook(service)}
    className="flex-shrink-0 w-60 rounded-2xl overflow-hidden bg-[#111f13]/90 border border-sage-600/25 shadow-xl mx-3 cursor-pointer group hover:-translate-y-1 transition-all duration-300"
  >
    <div className="h-36 overflow-hidden relative">
      <img
        src={getPhoto(service)}
        alt={service.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#111f13]/50 to-transparent" />
    </div>
    <div className="p-4">
      <h3 className="text-sage-50 font-semibold text-sm leading-snug mb-1">{service.name}</h3>
      <p className="text-sage-300/60 text-xs mb-3 line-clamp-2 leading-relaxed">{service.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-gold-400 font-bold text-sm">${(service.priceCents / 100).toFixed(0)}</span>
        <span className="text-sage-400/70 text-xs group-hover:text-gold-400/80 transition-colors">Book →</span>
      </div>
    </div>
  </div>
)

// Parse "value · label" stat format
const parseStat = (raw, fallbackVal, fallbackLbl) => {
  const [v, ...rest] = (raw || '').split('·')
  return { value: v?.trim() || fallbackVal, label: rest.join('·').trim() || fallbackLbl }
}

export const Home = () => {
  const [services, setServices] = useState(FALLBACK_SERVICES)
  const [gateService, setGateService] = useState(null) // null = modal closed
  const [gateOpen, setGateOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const tagline       = useContent('home_tagline',        'A boutique salon experience where every cut, color, and treatment is crafted with intention — and a little magic.')
  const hours         = useContent('home_hours',          'Mon – Sat  ·  9am – 7pm')
  const hoursNote     = useContent('home_hours_note',     'By Appointment · Walk-ins Welcome')
  const aboutHeading  = useContent('home_about_heading',  'Beautiful hair starts with listening.')
  const aboutBody     = useContent('home_about_body',     'Maggie built this salon on a simple belief: that great hair comes from understanding each client\'s life, style, and vision — not just their hair type. Every appointment is a collaboration.')
  const stat1         = parseStat(useContent('home_stat_1', '10+ · Years of experience'), '10+', 'Years of experience')
  const stat2         = parseStat(useContent('home_stat_2', '500+ · Happy clients'), '500+', 'Happy clients')
  const stat3         = parseStat(useContent('home_stat_3', '8 · Signature services'), '8', 'Signature services')
  const stat4         = parseStat(useContent('home_stat_4', '★★★★★ · Client rated'), '★★★★★', 'Client rated')

  useEffect(() => {
    api.get('/services')
      .then(res => { if (res.data?.length) setServices(res.data) })
      .catch(() => {})
  }, [])

  // If logged in, go straight to booking; otherwise show the gate modal
  const handleBookService = (service) => {
    if (user) {
      navigate('/book', { state: { serviceId: service._id } })
    } else {
      setGateService(service)
      setGateOpen(true)
    }
  }

  const handleBookGeneric = () => {
    if (user) {
      navigate('/book')
    } else {
      setGateService(null)
      setGateOpen(true)
    }
  }

  // Duplicate for seamless infinite scroll
  const ticker = [...services, ...services]

  return (
    <>
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden">

        {/* Maggie photo placeholder — dimmed, right-side background */}
        <div className="absolute inset-y-0 right-0 w-full md:w-3/5 pointer-events-none select-none">
          {/* Fade from left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1a0f] via-[#0d1a0f]/70 to-[#0d1a0f]/10 z-10" />
          {/* Fade at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0d1a0f] to-transparent z-10" />

          {/* Placeholder image — swap src for Maggie's actual photo */}
          <img
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&h=1100&q=60"
            alt="Maggie — placeholder"
            className="w-full h-full object-cover object-top opacity-20 grayscale"
          />

          {/* Placeholder label */}
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gold-400/50" />
            <span className="text-sage-500/60 text-xs tracking-widest uppercase font-light">
              Maggie's photo
            </span>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-20 px-8 md:px-20 py-24 max-w-2xl">

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-10 bg-gold-400/60" />
            <span className="text-gold-400/80 text-xs tracking-[0.25em] uppercase font-medium">
              Hair Salon
            </span>
          </div>

          {/* Name */}
          <h1 className="text-5xl md:text-6xl font-light text-sage-50 leading-tight mb-3">
            Styles
            <br />
            <span className="text-gold-400 font-semibold italic">by Maggie</span>
          </h1>

          {/* Tagline */}
          <p className="text-sage-200/70 text-lg font-light leading-relaxed mt-6 mb-10 max-w-md">
            {tagline}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleBookGeneric}
              className="px-8 py-3.5 bg-gold-500 hover:bg-gold-400 text-[#0d1a0f] font-semibold text-sm tracking-wide rounded-full transition-all duration-200 shadow-lg shadow-gold-500/20 hover:shadow-gold-400/30"
            >
              Book an Appointment
            </button>
            <Link
              to="/services"
              className="px-8 py-3.5 border border-sage-600/50 hover:border-sage-400/70 text-sage-200 hover:text-sage-50 text-sm tracking-wide rounded-full transition-all duration-200"
            >
              View All Services
            </Link>
          </div>

          {/* Quick info */}
          <div className="flex flex-wrap gap-6 mt-12 text-sage-400/70 text-xs tracking-wide">
            <span>{hours}</span>
            <span className="text-sage-600">|</span>
            <span>{hoursNote}</span>
          </div>
        </div>
      </section>

      {/* ── Services Ticker ── */}
      <section className="py-16 border-t border-sage-600/20">
        <div className="text-center mb-10 px-8">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="h-px w-12 bg-gold-400/40" />
            <span className="text-gold-400/70 text-xs tracking-[0.25em] uppercase font-medium">Services</span>
            <div className="h-px w-12 bg-gold-400/40" />
          </div>
          <h2 className="text-2xl font-light text-sage-50">
            What We Offer
          </h2>
        </div>

        {/* Scrolling belt — 1/6 edge fade on each side */}
        <div className="services-ticker overflow-hidden">
          <div className="services-ticker-inner py-2">
            {ticker.map((service, i) => (
              <ServiceCard key={`${service._id}-${i}`} service={service} onBook={handleBookService} />
            ))}
          </div>
        </div>

        <p className="text-center text-sage-600/50 text-xs mt-6 tracking-wide">
          Hover to pause · <Link to="/services" className="text-sage-400/70 hover:text-gold-400 transition-colors underline underline-offset-4">See full menu</Link>
        </p>
      </section>

      {/* ── About strip ── */}
      <section className="border-t border-sage-600/20 py-20 px-8 md:px-20">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8 bg-gold-400/50" />
              <span className="text-gold-400/70 text-xs tracking-[0.25em] uppercase">Our Philosophy</span>
            </div>
            <h2 className="text-3xl font-light text-sage-50 leading-snug mb-5">
              {aboutHeading}
            </h2>
            <p className="text-sage-300/60 leading-relaxed text-sm mb-6">
              {aboutBody}
            </p>
            <Link
              to="/about"
              className="text-sage-300/70 hover:text-gold-400 text-sm tracking-wide transition-colors flex items-center gap-2"
            >
              Meet Maggie
              <span className="text-gold-400">→</span>
            </Link>
          </div>

          {/* Decorative stat cards */}
          <div className="grid grid-cols-2 gap-4">
            {[stat1, stat2, stat3, stat4].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-xl border border-sage-600/20 bg-[#111f13]/50 p-5 text-center"
              >
                <div className="text-gold-400 text-xl font-semibold mb-1">{value}</div>
                <div className="text-sage-400/60 text-xs leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="border-t border-sage-600/20 py-16 px-8 text-center">
        <p className="text-sage-400/60 text-sm mb-6">Ready to transform your look?</p>
        <button
          onClick={handleBookGeneric}
          className="inline-block px-10 py-4 bg-sage-600/30 hover:bg-gold-500 border border-sage-500/40 hover:border-gold-500 text-sage-100 hover:text-[#0d1a0f] font-semibold text-sm tracking-wide rounded-full transition-all duration-300"
        >
          Book Your Appointment
        </button>
        <p className="text-sage-600/40 text-xs mt-8">
          © {new Date().getFullYear()} Styles by Maggie · All rights reserved
        </p>
      </section>

    </div>

    {/* Login-or-guest gate */}
    {gateOpen && (
      <BookingGateModal
        service={gateService}
        onClose={() => setGateOpen(false)}
      />
    )}
    </>
  )
}
