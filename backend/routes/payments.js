import { Router } from 'express'
import Stripe from 'stripe'
import Service from '../models/Service.js'
import { isValidId } from '../middleware/validate.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// POST /api/payments/create-intent
// Creates a PaymentIntent for the given service + optional add-ons.
// Returns { clientSecret, amount } — frontend uses clientSecret to confirm payment.
router.post('/create-intent', async (req, res, next) => {
  try {
    const { serviceId, addOnIds = [] } = req.body

    if (!serviceId || !isValidId(serviceId)) {
      return res.status(400).json({ message: 'Valid serviceId is required' })
    }
    if (!Array.isArray(addOnIds) || addOnIds.some((id) => !isValidId(id))) {
      return res.status(400).json({ message: 'Invalid addOnIds' })
    }

    const allIds = [serviceId, ...addOnIds]
    const services = await Service.find({ _id: { $in: allIds } })

    if (services.length !== allIds.length) {
      return res.status(404).json({ message: 'One or more services not found' })
    }

    const totalCents = services.reduce((sum, s) => sum + s.priceCents, 0)
    if (totalCents < 50) {
      return res.status(400).json({ message: 'Booking total is below the minimum charge amount' })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        serviceId,
        addOnIds: addOnIds.join(','),
        expectedCents: String(totalCents),
      },
    })

    res.json({ clientSecret: paymentIntent.client_secret, amount: totalCents })
  } catch (err) {
    next(err)
  }
})

export default router
