import { Link } from 'react-router-dom'
import { useContent } from '../context/ContentContext'

export const Contact = () => {
  const intro    = useContent('contact_intro',     'We\'d love to hear from you.')
  const address  = useContent('contact_address',   '123 Maple Ave, Suite 4, Nashville, TN 37201')
  const phone    = useContent('contact_phone',     '(615) 555-0142')
  const email    = useContent('contact_email',     'hello@stylesbymaggie.com')
  const hoursWk  = useContent('contact_hours_wk',  'Monday – Friday: 9am – 7pm')
  const hoursSat = useContent('contact_hours_sat', 'Saturday: 9am – 5pm')
  const hoursSun = useContent('contact_hours_sun', 'Sunday: Closed')
  const parking  = useContent('contact_parking',   '')

  return (
    <div className="min-h-[calc(100vh-64px)]">

      {/* ── Header ── */}
      <section className="py-20 px-8 md:px-20 border-b border-sage-600/20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-10 bg-gold-400/50" />
            <span className="text-gold-400/70 text-xs tracking-[0.25em] uppercase font-medium">Contact</span>
          </div>
          <h1 className="text-5xl font-light text-sage-50 mb-5">Get in Touch</h1>
          <p className="text-sage-300/65 text-base leading-relaxed max-w-xl">{intro}</p>
        </div>
      </section>

      {/* ── Details grid ── */}
      <section className="py-20 px-8 md:px-20">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">

          {/* Contact info */}
          <div className="space-y-6">
            <InfoBlock icon="📍" label="Location" value={address} />
            <InfoBlock
              icon="📞"
              label="Phone"
              value={<a href={`tel:${phone.replace(/\D/g,'')}`} className="hover:text-gold-400 transition-colors">{phone}</a>}
            />
            <InfoBlock
              icon="✉️"
              label="Email"
              value={<a href={`mailto:${email}`} className="hover:text-gold-400 transition-colors">{email}</a>}
            />
            {parking && <InfoBlock icon="🅿️" label="Parking" value={parking} />}
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-sage-100 font-semibold text-sm tracking-wide mb-5 flex items-center gap-3">
              <div className="h-px w-6 bg-gold-400/50" />
              Business Hours
            </h3>
            <div className="space-y-3 text-sm">
              <HourRow text={hoursWk} />
              <HourRow text={hoursSat} />
              <HourRow text={hoursSun} closed={hoursSun.toLowerCase().includes('closed')} />
            </div>

            <div className="mt-8 p-5 rounded-xl border border-sage-600/20 bg-[#111f13]/50">
              <p className="text-sage-400/70 text-sm leading-relaxed">
                Walk-ins are welcome when space allows. For guaranteed availability,{' '}
                <Link to="/book" className="text-gold-400 hover:underline">book online</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-sage-600/20 py-16 px-8 text-center">
        <p className="text-sage-400/60 text-sm mb-6">The easiest way to connect is to book an appointment.</p>
        <Link
          to="/book"
          className="inline-block px-10 py-4 bg-sage-600/30 hover:bg-gold-500 border border-sage-500/40 hover:border-gold-500 text-sage-100 hover:text-[#0d1a0f] font-semibold text-sm tracking-wide rounded-full transition-all duration-300"
        >
          Book an Appointment
        </Link>
      </section>

    </div>
  )
}

const InfoBlock = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="w-9 h-9 rounded-xl border border-sage-600/20 bg-[#111f13]/50 flex items-center justify-center text-base flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-sage-500 text-xs uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sage-200/80 text-sm leading-relaxed">{value}</p>
    </div>
  </div>
)

const HourRow = ({ text, closed }) => {
  const [day, ...rest] = text.split(':')
  const time = rest.join(':').trim()
  return (
    <div className="flex justify-between items-center border-b border-sage-700/30 pb-2">
      <span className="text-sage-400/70">{day?.trim()}</span>
      <span className={closed ? 'text-sage-600 italic' : 'text-sage-200'}>{time || text}</span>
    </div>
  )
}
