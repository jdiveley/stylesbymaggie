import mongoose from 'mongoose'

const stylistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String, default: '' },
  specialties: [{ type: String }],
  profileImage: { type: String, default: null },
  workingDays: {
    type: [Number],
    default: [1, 2, 3, 4, 5], // Mon–Fri
    validate: { validator: (v) => v.every((d) => d >= 0 && d <= 6), message: 'Invalid day' },
  },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Stylist', stylistSchema)
