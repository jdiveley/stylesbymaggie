import { Router } from 'express'
import { addMinutes, format, parse } from 'date-fns'
import Booking from '../models/Booking.js'
import Service from '../models/Service.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

// POST /api/bookings — authenticated customers
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { stylistId, serviceId, date, startTime, notes } = req.body
    if (!stylistId || !serviceId || !date || !startTime) {
      return res.status(400).json({ message: 'stylistId, serviceId, date, and startTime are required' })
    }

    const service = await Service.findById(serviceId)
    if (!service) return res.status(404).json({ message: 'Service not found' })

    const startParsed = parse(startTime, 'HH:mm', new Date(date))
    const endTime = format(addMinutes(startParsed, service.durationMinutes), 'HH:mm')

    // Check for conflicts
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999)
    const conflict = await Booking.findOne({
      stylistId,
      date: { $gte: dayStart, $lte: dayEnd },
      startTime,
      status: { $nin: ['cancelled'] },
    })
    if (conflict) return res.status(409).json({ message: 'This time slot is no longer available' })

    const booking = await Booking.create({
      customerId: req.user.userId,
      stylistId,
      serviceId,
      date: new Date(date),
      startTime,
      endTime,
      notes,
    })

    const populated = await booking.populate([
      { path: 'serviceId', select: 'name priceCents durationMinutes' },
      { path: 'stylistId', populate: { path: 'userId', select: 'name' } },
    ])

    res.status(201).json(populated)
  } catch (err) {
    next(err)
  }
})

// GET /api/bookings/my — customer's own bookings
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.userId })
      .populate('serviceId', 'name priceCents durationMinutes')
      .populate({ path: 'stylistId', populate: { path: 'userId', select: 'name avatar' } })
      .sort({ date: -1 })
    res.json(bookings)
  } catch (err) {
    next(err)
  }
})

// GET /api/bookings — admin: all bookings with optional filters
router.get('/', requireAuth, requireRole('admin', 'stylist'), async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    if (req.query.stylistId) filter.stylistId = req.query.stylistId
    if (req.query.date) {
      const d = new Date(req.query.date)
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999)
      filter.date = { $gte: dayStart, $lte: dayEnd }
    }

    // Stylists can only see their own bookings
    if (req.user.role === 'stylist') filter.stylistId = req.user.stylistId

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email phone')
      .populate('serviceId', 'name priceCents durationMinutes')
      .populate({ path: 'stylistId', populate: { path: 'userId', select: 'name' } })
      .sort({ date: -1, startTime: 1 })
    res.json(bookings)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/bookings/:id/status — stylist or admin
router.patch('/:id/status', requireAuth, requireRole('admin', 'stylist'), async (req, res, next) => {
  try {
    const { status } = req.body
    const allowed = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show']
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' })

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    )
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    res.json(booking)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/bookings/:id — admin only
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await Booking.findByIdAndDelete(req.params.id)
    res.json({ message: 'Booking deleted' })
  } catch (err) {
    next(err)
  }
})

export default router
