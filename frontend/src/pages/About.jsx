import { Link } from 'react-router-dom'
import { useContent } from '../context/ContentContext'

export const About = () => {
  const heading       = useContent('about_hero_heading',     'Meet Maggie')
  const sub           = useContent('about_hero_sub',         'Stylist · Colorist · Salon Owner')
  const bio1          = useContent('about_bio_p1',           '')
  const bio2          = useContent('about_bio_p2',           '')
  const bio3          = useContent('about_bio_p3',           '')
  const philHeading   = useContent('about_philosophy_heading','The Philosophy')
  const philBody      = useContent('about_philosophy_body',  '')
  const cred1         = useContent('about_credential_1',     '')
  const cred2         = useContent('about_credential_2',     '')
  const cred3         = useContent('about_credential_3',     '')
  const cred4         = useContent('about_credential_4',     '')

  const credentials = [cred1, cred2, cred3, cred4].filter(Boolean)

  return (
    <div className="min-h-[calc(100vh-64px)]">

      {/* ── Hero ── */}
      <section className="relative py-24 px-8 md:px-20 overflow-hidden border-b border-sage-600/20">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_50%,rgba(201,168,76,0.06),transparent)] pointer-events-none" />

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">

          {/* Photo placeholder */}
          <div className="relative order-2 md:order-1">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-sage-600/20">
              <img
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&h=800&q=60"
                alt="Maggie — placeholder"
                className="w-full h-full object-cover object-top opacity-40 grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a0f]/80 via-[#0d1a0f]/10 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400/60" />
                <span className="text-sage-500/60 text-xs tracking-widest uppercase">Photo coming soon</span>
              </div>
            </div>
            {/* Gold accent bar */}
            <div className="absolute -left-3 top-8 bottom-8 w-0.5 bg-gradient-to-b from-transparent via-gold-400/40 to-transparent" />
          </div>

          {/* Text */}
          <div className="order-1 md:order-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-10 bg-gold-400/50" />
              <span className="text-gold-400/70 text-xs tracking-[0.25em] uppercase font-medium">About</span>
            </div>

            <h1 className="text-5xl font-light text-sage-50 leading-tight mb-2">{heading}</h1>
            <p className="text-gold-400/70 text-sm tracking-wide italic mb-8">{sub}</p>

            <div className="space-y-4 text-sage-300/70 text-sm leading-relaxed">
              {bio1 && <p>{bio1}</p>}
              {bio2 && <p>{bio2}</p>}
              {bio3 && <p>{bio3}</p>}
            </div>

            <div className="mt-8">
              <Link
                to="/book"
                className="inline-flex items-center gap-2 px-7 py-3 bg-gold-500 hover:bg-gold-400 text-[#0d1a0f] font-semibold text-sm rounded-full transition-all duration-200 shadow-lg shadow-gold-500/20"
              >
                Book with Maggie
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Philosophy ── */}
      <section className="py-20 px-8 md:px-20 border-b border-sage-600/20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="h-px w-10 bg-gold-400/40" />
            <span className="text-gold-400/70 text-xs tracking-[0.25em] uppercase font-medium">Philosophy</span>
            <div className="h-px w-10 bg-gold-400/40" />
          </div>
          <h2 className="text-3xl font-light text-sage-50 mb-6">{philHeading}</h2>
          {philBody && (
            <p className="text-sage-300/65 leading-relaxed text-base">{philBody}</p>
          )}
        </div>
      </section>

      {/* ── Credentials ── */}
      {credentials.length > 0 && (
        <section className="py-20 px-8 md:px-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px w-10 bg-gold-400/40" />
              <span className="text-gold-400/70 text-xs tracking-[0.25em] uppercase font-medium">Training & Credentials</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {credentials.map((c, i) => (
                <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-sage-600/20 bg-[#111f13]/50">
                  <div className="w-1 h-1 rounded-full bg-gold-400 mt-2 flex-shrink-0" />
                  <p className="text-sage-200/80 text-sm">{c}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer CTA ── */}
      <section className="border-t border-sage-600/20 py-16 px-8 text-center">
        <p className="text-sage-400/60 text-sm mb-6">Ready to work together?</p>
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
