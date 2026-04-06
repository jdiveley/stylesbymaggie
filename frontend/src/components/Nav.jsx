import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
]

export const Nav = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <NavLink to="/" className="flex items-center space-x-3">
          <span className="self-center text-2xl font-semibold whitespace-nowrap text-sage-400">
            Styles by Maggie
          </span>
        </NavLink>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
          aria-controls="navbar-menu"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
          </svg>
        </button>

        <div
          id="navbar-menu"
          className={`${menuOpen ? 'block' : 'hidden'} w-full md:flex md:w-auto md:items-center gap-4`}
        >
          <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-6 md:mt-0 md:border-0 md:bg-white">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block py-2 px-3 rounded-sm md:p-0 transition-colors ${
                      isActive ? 'text-sage-400 font-semibold' : 'text-gray-700 hover:text-sage-400'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Auth area */}
          <div className="mt-2 md:mt-0">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sage-400 flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden md:inline">{user.name}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <NavLink
                      to="/book"
                      onClick={() => { setDropdownOpen(false); setMenuOpen(false) }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-sage-50 hover:text-sage-500"
                    >
                      Book Appointment
                    </NavLink>
                    {(user.role === 'stylist' || user.role === 'admin') && (
                      <NavLink
                        to="/manager"
                        onClick={() => { setDropdownOpen(false); setMenuOpen(false) }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-sage-50 hover:text-sage-500"
                      >
                        Manager Dashboard
                      </NavLink>
                    )}
                    {user.role === 'admin' && (
                      <NavLink
                        to="/admin"
                        onClick={() => { setDropdownOpen(false); setMenuOpen(false) }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-sage-50 hover:text-sage-500"
                      >
                        Admin Dashboard
                      </NavLink>
                    )}
                    <NavLink
                      to="/account/password"
                      onClick={() => { setDropdownOpen(false); setMenuOpen(false) }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-sage-50 hover:text-sage-500"
                    >
                      Change Password
                    </NavLink>
                    <div className="my-1 h-px bg-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                className="block py-2 px-4 text-sm font-medium text-white bg-sage-400 rounded-lg hover:bg-sage-500 transition-colors text-center"
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
