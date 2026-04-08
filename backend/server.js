import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import cors from 'cors'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

import authRoutes from './routes/auth.js'
import serviceRoutes from './routes/services.js'
import stylistRoutes from './routes/stylists.js'
import bookingRoutes from './routes/bookings.js'
import userRoutes from './routes/users.js'
import statsRoutes from './routes/stats.js'
import contentRoutes from './routes/content.js'

const app = express()
const PORT = process.env.PORT || 3000

const allowedOrigins = [
  'http://localhost:5175',
  'http://localhost:5173',
  process.env.CLIENT_ORIGIN,
].filter(Boolean)

app.use(helmet())
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json({ limit: '20kb' }))
app.use(mongoSanitize())   // strip $ and . from req.body / req.query / req.params
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
  app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')))
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

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })
