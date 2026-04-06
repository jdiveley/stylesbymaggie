import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: null },
  googleId: { type: String, default: null },
  role: { type: String, enum: ['customer', 'stylist', 'admin'], default: 'customer' },
  phone: { type: String, default: null },
  avatar: { type: String, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

userSchema.index({ googleId: 1 })

export default mongoose.model('User', userSchema)
