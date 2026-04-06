import { Router } from 'express'
import Service from '../models/Service.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

// GET /api/services — public
router.get('/', async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 })
    res.json(services)
  } catch (err) {
    next(err)
  }
})

// POST /api/services — admin only
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, description, priceCents, durationMinutes, category, imageUrl } = req.body
    if (!name || priceCents == null || !durationMinutes) {
      return res.status(400).json({ message: 'name, priceCents, and durationMinutes are required' })
    }
    const count = await Service.countDocuments()
    const service = await Service.create({
      name, description, priceCents, durationMinutes, category, imageUrl,
      displayOrder: count,
    })
    res.status(201).json(service)
  } catch (err) {
    next(err)
  }
})

// PUT /api/services/:id — admin only
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!service) return res.status(404).json({ message: 'Service not found' })
    res.json(service)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/services/:id — admin only (soft delete)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
    if (!service) return res.status(404).json({ message: 'Service not found' })
    res.json({ message: 'Service deactivated' })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/services/reorder — admin only
router.patch('/reorder', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { order } = req.body // [{ id, displayOrder }]
    await Promise.all(
      order.map(({ id, displayOrder }) =>
        Service.findByIdAndUpdate(id, { displayOrder })
      )
    )
    res.json({ message: 'Order updated' })
  } catch (err) {
    next(err)
  }
})

export default router
