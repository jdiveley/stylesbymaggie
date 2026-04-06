import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
}, { timestamps: true })

bookingSchema.index({ stylistId: 1, date: 1 })
bookingSchema.index({ customerId: 1 })

export default mongoose.model('Booking', bookingSchema)
