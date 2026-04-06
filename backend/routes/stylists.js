import { Router } from 'express'
import { addMinutes, format, parse, isBefore } from 'date-fns'
import Stylist from '../models/Stylist.js'
import Service from '../models/Service.js'
import Booking from '../models/Booking.js'
import User from '../models/User.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

// GET /api/stylists — public
router.get('/', async (req, res, next) => {
  try {
    const stylists = await Stylist.find({ isActive: true }).populate('userId', 'name email avatar')
    res.json(stylists)
  } catch (err) {
    next(err)
  }
})

// GET /api/stylists/:id — public
router.get('/:id', async (req, res, next) => {
  try {
    const stylist = await Stylist.findById(req.params.id).populate('userId', 'name email avatar')
    if (!stylist) return res.status(404).json({ message: 'Stylist not found' })
    res.json(stylist)
  } catch (err) {
    next(err)
  }
})

// GET /api/stylists/:id/availability?date=YYYY-MM-DD&serviceId=xxx
router.get('/:id/availability', async (req, res, next) => {
  try {
    const { date, serviceId } = req.query
    if (!date || !serviceId) {
      return res.status(400).json({ message: 'date and serviceId are required' })
    }

    const [stylist, service] = await Promise.all([
      Stylist.findById(req.params.id),
      Service.findById(serviceId),
    ])
    if (!stylist || !service) return res.status(404).json({ message: 'Stylist or service not found' })

    const requestedDate = new Date(date)
    const dayOfWeek = requestedDate.getDay()
    if (!stylist.workingDays.includes(dayOfWeek)) return res.json([])

    // Generate all slots
    const startBase = parse(stylist.workingHours.start, 'HH:mm', requestedDate)
    const endBase = parse(stylist.workingHours.end, 'HH:mm', requestedDate)
    const slots = []
    let cursor = startBase
    while (isBefore(addMinutes(cursor, service.durationMinutes), endBase) ||
           addMinutes(cursor, service.durationMinutes).getTime() === endBase.getTime()) {
      slots.push(format(cursor, 'HH:mm'))
      cursor = addMinutes(cursor, service.durationMinutes)
    }

    // Find booked slots for this day
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const bookings = await Booking.find({
      stylistId: req.params.id,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['cancelled'] },
    })

    const bookedStarts = new Set(bookings.map((b) => b.startTime))
    const available = slots.filter((s) => !bookedStarts.has(s))

    res.json(available)
  } catch (err) {
    next(err)
  }
})

// POST /api/stylists — admin only
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { userId, bio, specialties, workingDays, workingHours } = req.body
    if (!userId) return res.status(400).json({ message: 'userId is required' })

    await User.findByIdAndUpdate(userId, { role: 'stylist' })
    const stylist = await Stylist.create({ userId, bio, specialties, workingDays, workingHours })
    res.status(201).json(stylist)
  } catch (err) {
    next(err)
  }
})

// PUT /api/stylists/:id — admin only
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const stylist = await Stylist.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!stylist) return res.status(404).json({ message: 'Stylist not found' })
    res.json(stylist)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/stylists/:id — admin only
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const stylist = await Stylist.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
    if (!stylist) return res.status(404).json({ message: 'Stylist not found' })
    res.json({ message: 'Stylist deactivated' })
  } catch (err) {
    next(err)
  }
})

export default router
