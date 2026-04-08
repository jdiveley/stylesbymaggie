import { useNavigate } from 'react-router-dom'

/**
 * Modal shown when an unauthenticated user tries to book a service.
 * Offers "Sign In / Register" or "Continue as Guest".
 *
 * Props:
 *   service  – the service object the user clicked (or null for generic booking)
 *   onClose  – close the modal without navigating
 */
export const BookingGateModal = ({ service, onClose }) => {
  const navigate = useNavigate()

  const goToBook = (asGuest) => {
    onClose()
    navigate('/book', {
      state: {
        serviceId: service?._id ?? null,
        asGuest,
      },
    })
  }

  const goToLogin = () => {
    onClose()
    navigate('/login', { state: { from: { pathname: '/book' }, serviceId: service?._id ?? null } })
  }

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-sage-600/30 bg-[#111f13] shadow-2xl p-7 text-center">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-sage-600 hover:text-sage-300 transition-colors text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Icon / service name */}
        <div className="w-12 h-12 rounded-full bg-sage-600/20 border border-sage-500/30 flex items-center justify-center mx-auto mb-4 text-xl">
          ✂️
        </div>

        {service ? (
          <>
            <h2 className="text-sage-50 font-semibold text-lg mb-1">Book {service.name}</h2>
            <p className="text-gold-400 font-bold text-base mb-4">
              ${(service.priceCents / 100).toFixed(0)}
              <span className="text-sage-500 font-normal text-xs ml-2">
                · {service.durationMinutes} min
              </span>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-sage-50 font-semibold text-lg mb-1">Book an Appointment</h2>
            <p className="text-sage-400/70 text-sm mb-4">How would you like to continue?</p>
          </>
        )}

        <div className="space-y-3 mt-2">
          {/* Sign in CTA */}
          <button
            onClick={goToLogin}
            className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-[#0d1a0f] font-semibold rounded-xl text-sm transition-all shadow-lg shadow-gold-500/20"
          >
            Sign In / Register
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-sage-700/50" />
            <span className="text-sage-600 text-xs">or</span>
            <div className="flex-1 h-px bg-sage-700/50" />
          </div>

          {/* Guest CTA */}
          <button
            onClick={() => goToBook(true)}
            className="w-full py-3 border border-sage-600/40 hover:border-sage-400/60 text-sage-200 hover:text-sage-50 font-medium rounded-xl text-sm transition-all"
          >
            Continue as Guest
          </button>
        </div>

        <p className="text-sage-600/50 text-xs mt-5">
          Signing in lets you view and manage your bookings anytime.
        </p>
      </div>
    </div>
  )
}
