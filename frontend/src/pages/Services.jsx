import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'

const CATEGORY_COLORS = {
  cut: 'from-sage-400 to-emerald-600',
  color: 'from-gold-400 to-amber-500',
  treatment: 'from-teal-400 to-sage-500',
  styling: 'from-gold-400 to-yellow-500',
  other: 'from-sage-400 to-sage-600',
}

const CATEGORY_ICONS = {
  cut: '✂️',
  color: '🎨',
  treatment: '✨',
  styling: '💇',
  other: '💅',
}

const FALLBACK_SERVICES = [
  { _id: '1', name: "Women's Haircut", description: 'Precision cut with blow dry and style finish', priceCents: 6500, durationMinutes: 60, category: 'cut' },
  { _id: '2', name: "Men's Haircut", description: 'Classic cut with wash and style', priceCents: 3500, durationMinutes: 30, category: 'cut' },
  { _id: '3', name: 'Blowout', description: 'Wash and professional blow dry styling', priceCents: 4500, durationMinutes: 45, category: 'styling' },
  { _id: '4', name: 'Full Color', description: 'Single process all-over hair color', priceCents: 12000, durationMinutes: 120, category: 'color' },
  { _id: '5', name: 'Highlights', description: 'Partial or full highlights for dimension', priceCents: 15000, durationMinutes: 150, category: 'color' },
  { _id: '6', name: 'Balayage', description: 'Hand-painted highlights for a sun-kissed look', priceCents: 18000, durationMinutes: 180, category: 'color' },
  { _id: '7', name: 'Deep Conditioning', description: 'Intensive moisture treatment for all hair types', priceCents: 4000, durationMinutes: 30, category: 'treatment' },
  { _id: '8', name: 'Keratin Treatment', description: 'Smoothing treatment for frizz-free, shiny hair', priceCents: 25000, durationMinutes: 180, category: 'treatment' },
]

const ServiceCard = ({ service, onBook }) => {
  const gradient = CATEGORY_COLORS[service.category] ?? CATEGORY_COLORS.other
  const icon = CATEGORY_ICONS[service.category] ?? '💅'
  const price = `$${(service.priceCents / 100).toFixed(0)}`
  const duration = service.durationMinutes >= 60
    ? `${Math.floor(service.durationMinutes / 60)}h${service.durationMinutes % 60 ? ' ' + (service.durationMinutes % 60) + 'm' : ''}`
    : `${service.durationMinutes}m`

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`bg-gradient-to-br ${gradient} h-32 flex items-center justify-center text-5xl`}>
        {icon}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-1">{service.name}</h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">{service.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>⏱ {duration}</span>
            <span className="text-gold-400 font-bold text-lg">{price}</span>
          </div>
          <button
            onClick={() => onBook(service)}
            className="px-4 py-2 bg-sage-400 hover:bg-sage-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  )
}

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
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow">Our Services</h1>
        <p className="text-white/80">Professional hair care tailored just for you</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              activeCategory === cat
                ? 'bg-sage-400 text-white'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            {cat === 'all' ? 'All Services' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-sage-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((service) => (
            <ServiceCard key={service._id} service={service} onBook={handleBook} />
          ))}
        </div>
      )}
    </div>
  )
}
