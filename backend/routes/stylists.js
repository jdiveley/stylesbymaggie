import { Router } from 'express'
import { addMinutes, format, parse, isBefore } from 'date-fns'
import Stylist from '../models/Stylist.js'
import Service from '../models/Service.js'
import Booking from '../models/Booking.js'
import User from '../models/User.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { isValidId, isValidDate } from '../middleware/validate.js'

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

// GET /api/stylists/me — returns the calling user's own stylist profile
// Must be registered BEFORE /:id to avoid Express treating "me" as an ID
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const stylist = await Stylist.findOne({ userId: req.user.userId }).populate('userId', 'name email avatar')
    if (!stylist) return res.status(404).json({ message: 'No stylist profile found for this account' })
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
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid stylist id' })
    if (!isValidId(serviceId))     return res.status(400).json({ message: 'Invalid serviceId' })
    if (!isValidDate(date))        return res.status(400).json({ message: 'Invalid date' })

    const [stylist, service] = await Promise.all([
      Stylist.findById(req.params.id),
      Service.findById(serviceId),
    ])
    if (!stylist || !service) return res.status(404).json({ message: 'Stylist or service not found' })

    // Parse date string as local date to avoid UTC-midnight day-of-week shift
    const [yyyy, mm, dd] = date.split('-').map(Number)
    const requestedDate = new Date(yyyy, mm - 1, dd)
    const dayOfWeek = requestedDate.getDay()

    // Use saved schedule; fall back to Mon–Fri 9–18 for docs created before this feature
    const effectiveSchedule = stylist.schedule?.length
      ? stylist.schedule
      : [1,2,3,4,5].map((d) => ({ day: d, start: '09:00', end: '18:00' }))
    const dayEntry = effectiveSchedule.find((s) => Number(s.day) === dayOfWeek)
    if (!dayEntry) return res.json({ all: [], available: [] })

    // Generate all slots for this day
    const startBase = parse(dayEntry.start, 'HH:mm', requestedDate)
    const endBase   = parse(dayEntry.end,   'HH:mm', requestedDate)
    const slots = []
    let cursor = startBase
    while (isBefore(addMinutes(cursor, service.durationMinutes), endBase) ||
           addMinutes(cursor, service.durationMinutes).getTime() === endBase.getTime()) {
      slots.push(format(cursor, 'HH:mm'))
      cursor = addMinutes(cursor, service.durationMinutes)
    }

    // Find booked slots for this day
    const dayStart = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0)
    const dayEnd   = new Date(yyyy, mm - 1, dd, 23, 59, 59, 999)

    const bookings = await Booking.find({
      stylistId: req.params.id,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['cancelled'] },
    })

    const bookedStarts = new Set(bookings.map((b) => b.startTime))
    const available = slots.filter((s) => !bookedStarts.has(s))

    res.json({ all: slots, available })
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

// PATCH /api/stylists/:id/availability — self, owner, or admin
router.patch('/:id/availability', requireAuth, async (req, res, next) => {
  try {
    const stylist = await Stylist.findById(req.params.id)
    if (!stylist) return res.status(404).json({ message: 'Stylist not found' })

    const isSelf = stylist.userId.toString() === req.user.userId
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'owner'
    if (!isSelf && !isPrivileged) {
      return res.status(403).json({ message: "Not authorised to update this stylist's availability" })
    }

    const { schedule } = req.body
    if (schedule === undefined) return res.status(400).json({ message: 'schedule is required' })

    // Use findByIdAndUpdate/$set to reliably replace the subdocument array.
    // Direct doc assignment + save() has known Mongoose quirks with array tracking.
    const updated = await Stylist.findByIdAndUpdate(
      req.params.id,
      { $set: { schedule } },
      { new: true, runValidators: false },
    )
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// POST /api/stylists — admin or owner
router.post('/', requireAuth, requireRole('admin', 'owner'), async (req, res, next) => {
  try {
    const { userId, bio, specialties, schedule } = req.body
    if (!userId) return res.status(400).json({ message: 'userId is required' })

    await User.findByIdAndUpdate(userId, { role: 'stylist' })
    const stylist = await Stylist.create({ userId, bio, specialties, schedule })
    res.status(201).json(stylist)
  } catch (err) {
    next(err)
  }
})

// PUT /api/stylists/:id — admin or owner
router.put('/:id', requireAuth, requireRole('admin', 'owner'), async (req, res, next) => {
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
