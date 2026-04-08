import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  // Authenticated customer (null for guest bookings)
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Guest info (populated when customerId is null)
  guestName:  { type: String, default: null },
  guestEmail: { type: String, default: null },
  guestPhone: { type: String, default: null },

  stylistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stylist', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },  // '14:00'
  endTime: { type: String, required: true },    // '15:00'
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending',
  },
  notes: { type: String, default: '' },
  paymentIntentId: { type: String, default: null },
  amountPaidCents: { type: Number, default: null },
}, { timestamps: true })

bookingSchema.index({ stylistId: 1, date: 1 })
bookingSchema.index({ customerId: 1 })

export default mongoose.model('Booking', bookingSchema)
