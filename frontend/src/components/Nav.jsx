import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/',        label: 'Home',     end: true },
  { to: '/about',   label: 'About' },
  { to: '/services',label: 'Services' },
  { to: '/contact', label: 'Contact' },
]

// Scissors SVG — matches the favicon
const ScissorsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="24" cy="78" r="14" stroke="#C9A84C" strokeWidth="5.5"/>
    <circle cx="60" cy="78" r="14" stroke="#C9A84C" strokeWidth="5.5"/>
    <circle cx="44" cy="42" r="5" fill="#C9A84C"/>
    <line x1="24" y1="64" x2="78" y2="10" stroke="#C9A84C" strokeWidth="5.5" strokeLinecap="round"/>
    <line x1="60" y1="64" x2="24" y2="10" stroke="#C9A84C" strokeWidth="5.5" strokeLinecap="round"/>
  </svg>
)

export const Nav = () => {
  const [menuOpen, setMenuOpen]       = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [scrolled, setScrolled]       = useState(false)
  const { user, logout }              = useAuth()
  const navigate                      = useNavigate()
  const location                      = useLocation()
  const dropdownRef                   = useRef(null)

  // Shrink / blur on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setDropdownOpen(false) }, [location.pathname])

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  return (
    <nav className={`sticky top-0 z-40 transition-all duration-300 ${
      scrolled
        ? 'bg-[#0a150c]/90 backdrop-blur-md border-b border-sage-600/20 shadow-lg shadow-black/20'
        : 'bg-[#0d1a0f]/70 backdrop-blur-sm border-b border-sage-600/10'
    }`}>
      <div className="max-w-screen-xl mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <NavLink to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <span className="transition-transform duration-300 group-hover:rotate-12">
              <ScissorsIcon />
            </span>
            <div className="leading-tight">
              <span className="block text-sage-50 font-semibold text-base tracking-wide">
                Styles
                <span className="text-gold-400 italic font-light"> by </span>
                <span className="text-sage-50">Maggie</span>
              </span>
            </div>
          </NavLink>

          {/* ── Desktop nav links ── */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'text-gold-400'
                        : 'text-sage-300/80 hover:text-sage-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {label}
                      {isActive && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-400" />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* ── Right side: Book CTA + user ── */}
          <div className="hidden md:flex items-center gap-3">
            {/* Book CTA — always visible */}
            <NavLink
              to="/book"
              className="px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full border border-gold-400/60 text-gold-400 hover:bg-gold-400 hover:text-[#0d1a0f] transition-all duration-200"
            >
              Book Now
            </NavLink>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-sage-600/40 hover:border-sage-400/60 bg-sage-800/20 hover:bg-sage-700/30 transition-all duration-200"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-sage-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {user.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <span className="text-xs font-medium text-sage-200 max-w-[90px] truncate">{user.name}</span>
                  <svg
                    className={`w-3 h-3 text-sage-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-sage-600/30 bg-[#0f1f11]/95 backdrop-blur-md shadow-xl shadow-black/30 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-sage-700/40 mb-1">
                      <p className="text-xs text-sage-400 truncate">{user.email ?? user.name}</p>
                      <p className="text-[10px] text-sage-600 capitalize mt-0.5">{user.role}</p>
                    </div>
                    <DropItem to="/book" label="Book Appointment" onClose={() => setDropdownOpen(false)} />
                    {['stylist','owner','admin'].includes(user.role) && (
                      <DropItem to="/manager" label="Manager Dashboard" onClose={() => setDropdownOpen(false)} />
                    )}
                    {['owner','admin'].includes(user.role) && (
                      <DropItem to="/admin" label="Admin Dashboard" onClose={() => setDropdownOpen(false)} />
                    )}
                    <DropItem to="/account/password" label="Change Password" onClose={() => setDropdownOpen(false)} />
                    <div className="my-1 mx-2 h-px bg-sage-700/40" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-400/5 transition-colors rounded-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full bg-sage-600/30 hover:bg-sage-600/50 border border-sage-500/30 hover:border-sage-400/50 text-sage-200 hover:text-sage-50 transition-all duration-200"
              >
                Sign In
              </NavLink>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="md:hidden flex flex-col items-center justify-center w-9 h-9 gap-1.5 rounded-lg border border-sage-600/30 hover:border-sage-400/50 transition-colors"
          >
            <span className={`block w-5 h-0.5 bg-sage-300 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-sage-300 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-sage-300 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
        menuOpen ? 'max-h-96 border-t border-sage-700/30' : 'max-h-0'
      }`}>
        <div className="px-5 py-4 space-y-1 bg-[#0a150c]/95 backdrop-blur-md">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sage-700/40 text-gold-400'
                    : 'text-sage-300 hover:bg-sage-700/20 hover:text-sage-50'
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          <div className="pt-2 border-t border-sage-700/30 mt-2 space-y-1">
            <NavLink
              to="/book"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-gold-400 border border-gold-400/40 hover:bg-gold-400/10 transition-colors"
            >
              Book Now
            </NavLink>

            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sage-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-sage-100 font-medium">{user.name}</p>
                    <p className="text-xs text-sage-500 capitalize">{user.role}</p>
                  </div>
                </div>
                {['stylist','owner','admin'].includes(user.role) && (
                  <NavLink to="/manager" className="block px-3 py-2 text-sm text-sage-300 hover:text-sage-50 rounded-xl hover:bg-sage-700/20 transition-colors">
                    Manager Dashboard
                  </NavLink>
                )}
                {['owner','admin'].includes(user.role) && (
                  <NavLink to="/admin" className="block px-3 py-2 text-sm text-sage-300 hover:text-sage-50 rounded-xl hover:bg-sage-700/20 transition-colors">
                    Admin Dashboard
                  </NavLink>
                )}
                <NavLink to="/account/password" className="block px-3 py-2 text-sm text-sage-300 hover:text-sage-50 rounded-xl hover:bg-sage-700/20 transition-colors">
                  Change Password
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-400/70 hover:text-red-400 rounded-xl hover:bg-red-400/5 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="block px-3 py-2.5 text-sm text-center text-sage-200 rounded-xl border border-sage-600/30 hover:border-sage-400/50 hover:text-sage-50 transition-colors"
              >
                Sign In
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

const DropItem = ({ to, label, onClose }) => (
  <NavLink
    to={to}
    onClick={onClose}
    className="block px-4 py-2 text-xs text-sage-300 hover:text-sage-50 hover:bg-sage-700/30 transition-colors rounded-lg mx-1"
  >
    {label}
  </NavLink>
)
