import React from 'react'
import { ParticlesComponent } from './components/Particles'
import { Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Nav } from './components/Nav'

export const App = () => {
  return (
      <div className="App flex flex-col h-screen">
        <ParticlesComponent id="tsparticles" className='absolute top-0 left-0 w-full h-full z-0' />
        <div className="relative z-10">
          <Nav />
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<div>About</div>} />
        <Route path="/contact" element={<div>Contact</div>} />
        {/*Add more routes as needed */}
      </Routes>
    </div>
  )
}

