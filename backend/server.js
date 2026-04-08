import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import cors from 'cors'
import helmet from 'helmet'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

import bcrypt from 'bcryptjs'
import authRoutes from './routes/auth.js'
import serviceRoutes from './routes/services.js'
import stylistRoutes from './routes/stylists.js'
import bookingRoutes from './routes/bookings.js'
import userRoutes from './routes/users.js'
import statsRoutes from './routes/stats.js'
import contentRoutes from './routes/content.js'
import User from './models/User.js'

const app = express()
const PORT = process.env.PORT || 3000

const allowedOrigins = [
  'http://localhost:5175',
  'http://localhost:5173',
  process.env.CLIENT_ORIGIN,
].filter(Boolean)

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'https://images.unsplash.com'],
      'script-src': ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
      'script-src-elem': ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
      'connect-src': ["'self'", 'https://www.google-analytics.com', 'https://analytics.google.com', 'https://www.googletagmanager.com', 'https://www.google.com'],
      'frame-src': ["'self'", 'https://www.googletagmanager.com'],
    },
  },
}))
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json({ limit: '20kb' }))
app.use(morgan('dev'))

app.use('/api/auth', authRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/stylists', stylistRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/users', userRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/content', contentRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Serve React SPA in production
const distPath = join(__dirname, '../frontend/dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('/{*splat}', (_req, res) => res.sendFile(join(distPath, 'index.html')))
}

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status ?? 500).json({
    message: err.message ?? 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

async function seedDefaultUsers() {
  const seeds = [
    { username: 'jdiveley', name: 'J Diveley', role: 'admin',  password: 'changeme' },
    { username: 'maggie',   name: 'Maggie',    role: 'owner',  password: 'changeme' },
  ]
  for (const s of seeds) {
    const exists = await User.findOne({ username: s.username })
    if (!exists) {
      await User.create({
        username: s.username,
        name: s.name,
        role: s.role,
        passwordHash: await bcrypt.hash(s.password, 12),
        isActive: true,
      })
      console.log(`Seeded user: ${s.username} (${s.role})`)
    }
  }
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB')
    await seedDefaultUsers()
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })
