import './App.css'
import { Routes, Route } from 'react-router-dom'
import { ParticlesComponent } from './components/Particles'
import { Nav } from './components/Nav'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { Services } from './pages/Services'
import { Login } from './pages/Login'
import { Feedback } from './pages/Feedback'
import { Booking } from './pages/Booking'
import { AdminDashboard } from './pages/AdminDashboard'
import { ManagerDashboard } from './pages/ManagerDashboard'
import { ChangePassword } from './pages/ChangePassword'

export const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <ParticlesComponent id="tsparticles" className="absolute top-0 left-0 w-full h-full z-0" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Nav />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/login" element={<Login />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route
              path="/book"
              element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager"
              element={
                <ProtectedRoute roles={['admin', 'stylist']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}
