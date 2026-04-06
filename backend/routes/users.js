import { Router } from 'express'
import User from '../models/User.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

// GET /api/users — admin only
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.role) filter.role = req.query.role
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 })
    res.json(users)
  } catch (err) {
    next(err)
  }
})

// PUT /api/users/:id/role — admin only
router.put('/:id/role', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { role } = req.body
    if (!['customer', 'stylist', 'admin'].includes(role)) {
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
