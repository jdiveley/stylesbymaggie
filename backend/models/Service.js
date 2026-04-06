import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  priceCents: { type: Number, required: true, min: 0 },
  durationMinutes: { type: Number, required: true, min: 15 },
  category: {
    type: String,
    enum: ['cut', 'color', 'treatment', 'styling', 'other'],
    default: 'other',
  },
  imageUrl: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true })

serviceSchema.index({ isActive: 1, displayOrder: 1 })

export default mongoose.model('Service', serviceSchema)
