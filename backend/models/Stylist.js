import mongoose from 'mongoose'

const stylistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String, default: '' },
  specialties: [{ type: String }],
  profileImage: { type: String, default: null },
  schedule: {
    type: [
      {
        day:   { type: Number, required: true, min: 0, max: 6 },
        start: { type: String, required: true, default: '09:00' },
        end:   { type: String, required: true, default: '18:00' },
      },
    ],
    default: [
      { day: 1, start: '09:00', end: '18:00' },
      { day: 2, start: '09:00', end: '18:00' },
      { day: 3, start: '09:00', end: '18:00' },
      { day: 4, start: '09:00', end: '18:00' },
      { day: 5, start: '09:00', end: '18:00' },
    ],
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Stylist', stylistSchema)
