import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

// GET /api/users — admin or owner
router.get('/', requireAuth, requireRole('admin', 'owner'), async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.role) filter.role = req.query.role
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 })
    res.json(users)
  } catch (err) {
    next(err)
  }
})

// POST /api/users — admin or owner creates a new account
router.post('/', requireAuth, requireRole('admin', 'owner'), async (req, res, next) => {
  try {
    const { name, username, email, password, role } = req.body
    if (!name || !password) {
      return res.status(400).json({ message: 'name and password are required' })
    }
    if (!username && !email) {
      return res.status(400).json({ message: 'username or email is required' })
    }
    const validRoles = ['customer', 'stylist', 'owner', 'admin']
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }
    // Check for duplicates
    const orClauses = []
    if (username) orClauses.push({ username: username.toLowerCase() })
    if (email) orClauses.push({ email: email.toLowerCase() })
    const existing = await User.findOne({ $or: orClauses })
    if (existing) {
      return res.status(409).json({ message: 'A user with that username or email already exists' })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({
      name,
      username: username?.toLowerCase() || undefined,
      email: email?.toLowerCase() || undefined,
      passwordHash,
      role: role ?? 'customer',
    })
    const { passwordHash: _, ...safe } = user.toObject()
    res.status(201).json(safe)
  } catch (err) {
    next(err)
  }
})

// PUT /api/users/:id/role — admin or owner
router.put('/:id/role', requireAuth, requireRole('admin', 'owner'), async (req, res, next) => {
  try {
    const { role } = req.body
    if (!['customer', 'stylist', 'owner', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/users/:id — admin only (soft delete)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' })
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ message: 'User deactivated' })
  } catch (err) {
    next(err)
  }
})

export default router
