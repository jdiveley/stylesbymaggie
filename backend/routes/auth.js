import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const signToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })

const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
})

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: 'Email already in use' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash })
    res.status(201).json({ token: signToken(user), user: safeUser(user) })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/login — accepts email OR username in the `identifier` field
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' })
    }
    const lower = identifier.toLowerCase()
    const user = await User.findOne({
      $or: [{ email: lower }, { username: lower }],
      isActive: true,
    })
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' })

    res.json({ token: signToken(user), user: safeUser(user) })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/google
router.post('/google', async (req, res, next) => {
  try {
    const { idToken } = req.body
    if (!idToken) return res.status(400).json({ message: 'idToken is required' })

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const { sub: googleId, email, name, picture } = ticket.getPayload()

    const user = await User.findOneAndUpdate(
      { $or: [{ googleId }, { email }] },
      { $set: { googleId, name, avatar: picture, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.json({ token: signToken(user), user: safeUser(user) })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(safeUser(user))
  } catch (err) {
    next(err)
  }
})

// PUT /api/auth/password
router.put('/password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!newPassword) return res.status(400).json({ message: 'newPassword is required' })
    if (newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' })

    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // If user already has a password, verify the current one
    if (user.passwordHash) {
      if (!currentPassword) return res.status(400).json({ message: 'currentPassword is required' })
      const valid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!valid) return res.status(401).json({ message: 'Current password is incorrect' })
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12)
    await user.save()
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
