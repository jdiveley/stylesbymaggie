import { Router } from 'express'
import Booking from '../models/Booking.js'
import User from '../models/User.js'
import Service from '../models/Service.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

// GET /api/stats — admin only
router.get('/', requireAuth, requireRole('admin', 'owner'), async (req, res, next) => {
  try {
    const [totalBookings, pendingBookings, completedBookings, totalCustomers, totalServices] =
      await Promise.all([
        Booking.countDocuments(),
        Booking.countDocuments({ status: 'pending' }),
        Booking.countDocuments({ status: 'completed' }),
        User.countDocuments({ role: 'customer', isActive: true }),
        Service.countDocuments({ isActive: true }),
      ])

    // Revenue: sum of service prices for completed bookings
    const revenueResult = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $lookup: { from: 'services', localField: 'serviceId', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      { $group: { _id: null, totalCents: { $sum: '$service.priceCents' } } },
    ])
    const revenueCents = revenueResult[0]?.totalCents ?? 0

    // Top 5 popular services
    const topServices = await Booking.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: '$serviceId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      { $project: { _id: 0, name: '$service.name', count: 1 } },
    ])

    // Bookings by status
    const byStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])

    res.json({
      totalBookings,
      pendingBookings,
      completedBookings,
      totalCustomers,
      totalServices,
      revenueCents,
      topServices,
      byStatus,
    })
  } catch (err) {
    next(err)
  }
})

export default router
