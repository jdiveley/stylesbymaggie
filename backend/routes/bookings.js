import { Router } from 'express'
import { addMinutes, format, parse } from 'date-fns'
import Stripe from 'stripe'
import Booking from '../models/Booking.js'
import Service from '../models/Service.js'
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js'
import { isValidId, isValidTime, isValidDate, isValidEmail, isValidPhone, sanitizeStr } from '../middleware/validate.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const router = Router()

// POST /api/bookings — authenticated or guest
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { stylistId, serviceId, date, startTime, paymentIntentId } = req.body
    const notes      = sanitizeStr(req.body.notes, 1000)
    const guestName  = sanitizeStr(req.body.guestName, 100)
    const guestEmail = sanitizeStr(req.body.guestEmail, 200)
    const guestPhone = sanitizeStr(req.body.guestPhone, 30)

    // Required fields
    if (!stylistId || !serviceId || !date || !startTime) {
      return res.status(400).json({ message: 'stylistId, serviceId, date, and startTime are required' })
    }

    // ID format validation
    if (!isValidId(stylistId)) return res.status(400).json({ message: 'Invalid stylistId' })
    if (!isValidId(serviceId)) return res.status(400).json({ message: 'Invalid serviceId' })

    // Date / time validation
    if (!isValidDate(date)) return res.status(400).json({ message: 'Invalid date' })
    if (!isValidTime(startTime)) return res.status(400).json({ message: 'startTime must be HH:mm' })

    // Auth: either logged-in user or valid guest info
    if (!req.user) {
      if (!guestName)  return res.status(400).json({ message: 'guestName is required for guest bookings' })
      if (!guestEmail) return res.status(400).json({ message: 'guestEmail is required for guest bookings' })
      if (!isValidEmail(guestEmail)) return res.status(400).json({ message: 'Invalid guestEmail' })
      if (!guestPhone) return res.status(400).json({ message: 'guestPhone is required for guest bookings' })
      if (!isValidPhone(guestPhone)) return res.status(400).json({ message: 'Invalid guestPhone — enter a valid phone number' })
    }

    // Verify payment when a paymentIntentId is supplied (required for public bookings)
    let amountPaidCents = null
    if (paymentIntentId) {
      if (typeof paymentIntentId !== 'string' || !/^pi_[A-Za-z0-9_]+$/.test(paymentIntentId)) {
        return res.status(400).json({ message: 'Invalid paymentIntentId' })
      }
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
      if (intent.status !== 'succeeded') {
        return res.status(402).json({ message: 'Payment has not been completed' })
      }
      if (intent.metadata?.serviceId !== serviceId) {
        return res.status(400).json({ message: 'Payment does not match this booking' })
      }
      // Prevent reuse of the same PaymentIntent for a second booking
      const duplicate = await Booking.findOne({ paymentIntentId })
      if (duplicate) return res.status(409).json({ message: 'This payment has already been used' })
      amountPaidCents = intent.amount
    }

    const service = await Service.findById(serviceId)
    if (!service) return res.status(404).json({ message: 'Service not found' })

    const startParsed = parse(startTime, 'HH:mm', new Date(date))
    const endTime = format(addMinutes(startParsed, service.durationMinutes), 'HH:mm')

    // Conflict check
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
    const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999)
    const conflict = await Booking.findOne({
      stylistId,
      date: { $gte: dayStart, $lte: dayEnd },
      startTime,
      status: { $nin: ['cancelled'] },
    })
    if (conflict) return res.status(409).json({ message: 'This time slot is no longer available' })

    const bookingData = {
      stylistId,
      serviceId,
      date: new Date(date),
      startTime,
      endTime,
      notes,
      paymentIntentId: paymentIntentId ?? null,
      amountPaidCents,
    }

    if (req.user) {
      bookingData.customerId = req.user.userId
    } else {
      bookingData.guestName  = guestName
      bookingData.guestEmail = guestEmail
      bookingData.guestPhone = guestPhone || null
    }

    const booking = await Booking.create(bookingData)
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

// GET /api/bookings — admin/owner/stylist: all bookings with optional filters
router.get('/', requireAuth, requireRole('admin', 'owner', 'stylist'), async (req, res, next) => {
  try {
    const filter = {}

    // Whitelist status values to prevent injection
    const ALLOWED_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show']
    if (req.query.status) {
      if (!ALLOWED_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: 'Invalid status filter' })
      }
      filter.status = req.query.status
    }

    if (req.query.stylistId) {
      if (!isValidId(req.query.stylistId)) return res.status(400).json({ message: 'Invalid stylistId' })
      filter.stylistId = req.query.stylistId
    }

    if (req.query.date) {
      if (!isValidDate(req.query.date)) return res.status(400).json({ message: 'Invalid date' })
      const d = new Date(req.query.date)
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0)
      const dayEnd   = new Date(d); dayEnd.setHours(23, 59, 59, 999)
      filter.date = { $gte: dayStart, $lte: dayEnd }
    }

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
router.patch('/:id/status', requireAuth, requireRole('admin', 'owner', 'stylist'), async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid booking id' })

    const ALLOWED = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show']
    const { status } = req.body
    if (!ALLOWED.includes(status)) return res.status(400).json({ message: 'Invalid status' })

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
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid booking id' })
    await Booking.findByIdAndDelete(req.params.id)
    res.json({ message: 'Booking deleted' })
  } catch (err) {
    next(err)
  }
})

export default router
