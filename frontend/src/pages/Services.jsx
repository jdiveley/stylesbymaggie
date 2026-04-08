import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'

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
  { _id: '1', name: "Women's Haircut",   description: 'Precision cut with blow dry and style finish',           priceCents: 6500,  durationMinutes: 60,  category: 'cut'       },
  { _id: '2', name: "Men's Haircut",     description: 'Classic cut with wash and style',                        priceCents: 3500,  durationMinutes: 30,  category: 'cut'       },
  { _id: '3', name: 'Blowout',           description: 'Wash and professional blow dry styling',                  priceCents: 4500,  durationMinutes: 45,  category: 'styling'   },
  { _id: '4', name: 'Full Color',        description: 'Single process all-over hair color',                      priceCents: 12000, durationMinutes: 120, category: 'color'     },
  { _id: '5', name: 'Highlights',        description: 'Partial or full highlights for dimension',                priceCents: 15000, durationMinutes: 150, category: 'color'     },
  { _id: '6', name: 'Balayage',          description: 'Hand-painted highlights for a sun-kissed look',           priceCents: 18000, durationMinutes: 180, category: 'color'     },
  { _id: '7', name: 'Deep Conditioning', description: 'Intensive moisture treatment for all hair types',         priceCents: 4000,  durationMinutes: 30,  category: 'treatment' },
  { _id: '8', name: 'Keratin Treatment', description: 'Smoothing treatment for frizz-free, shiny hair',         priceCents: 25000, durationMinutes: 180, category: 'treatment' },
]

const CATEGORY_LABELS = { all: 'All Services', cut: 'Cuts', color: 'Color', treatment: 'Treatments', styling: 'Styling', other: 'Other' }

const getPhoto = (service) =>
  SERVICE_PHOTOS[service.name.toLowerCase()] || CATEGORY_PHOTOS[service.category] || CATEGORY_PHOTOS.cut

const fmtDuration = (min) =>
  min >= 60
    ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}`
    : `${min}m`

const ServiceCard = ({ service, onBook }) => (
  <div
    className="flex flex-col rounded-2xl overflow-hidden bg-[#111f13]/90 border border-sage-600/25 shadow-xl group cursor-pointer hover:-translate-y-1 transition-all duration-300"
    onClick={() => onBook(service)}
  >
    <div className="h-44 overflow-hidden relative">
      <img
        src={getPhoto(service)}
        alt={service.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#111f13]/60 to-transparent" />
    </div>
    <div className="p-5 flex flex-col flex-1">
      <h3 className="text-sage-50 font-semibold text-base leading-snug mb-1.5">{service.name}</h3>
      <p className="text-sage-300/60 text-xs leading-relaxed mb-4 flex-1">{service.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-sage-500">
          <span>{fmtDuration(service.durationMinutes)}</span>
          <span className="text-gold-400 font-bold text-base">${(service.priceCents / 100).toFixed(0)}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onBook(service) }}
          className="px-4 py-1.5 bg-sage-600/40 hover:bg-gold-500 border border-sage-500/40 hover:border-gold-500 text-sage-100 hover:text-[#0d1a0f] text-xs font-semibold rounded-full transition-all duration-200"
        >
          Book Now
        </button>
      </div>
    </div>
  </div>
)

export const Services = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/services')
      .then((res) => setServices(res.data.length ? res.data : FALLBACK_SERVICES))
      .catch(() => setServices(FALLBACK_SERVICES))
      .finally(() => setLoading(false))
  }, [])

  const categories = ['all', ...new Set(services.map((s) => s.category))]
  const filtered = activeCategory === 'all' ? services : services.filter((s) => s.category === activeCategory)

  const handleBook = (service) => {
    navigate('/book', { state: { serviceId: service._id } })
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="h-px w-10 bg-gold-400/40" />
          <span className="text-gold-400/70 text-xs tracking-[0.25em] uppercase font-medium">Menu</span>
          <div className="h-px w-10 bg-gold-400/40" />
        </div>
        <h1 className="text-4xl font-light text-sage-50 mb-3">Our Services</h1>
        <p className="text-sage-300/60 text-sm">Professional hair care crafted with intention</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-1.5 rounded-full text-xs font-medium capitalize tracking-wide transition-all ${
              activeCategory === cat
                ? 'bg-gold-500 text-[#0d1a0f]'
                : 'border border-sage-600/40 text-sage-400 hover:border-sage-400/60 hover:text-sage-200'
            }`}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((service) => (
            <ServiceCard key={service._id} service={service} onBook={handleBook} />
          ))}
        </div>
      )}
    </div>
  )
}
