/**
 * Seed script — creates the default admin and manager accounts.
 * Run once: node backend/seed.js
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from './models/User.js'

const SEED_USERS = [
  {
    name: 'J Diveley',
    username: 'jdiveley',
    email: 'admin@stylesbymaggie.com',
    password: 'changeme',
    role: 'admin',
  },
  {
    name: 'Maggie',
    username: 'maggie',
    email: 'maggie@stylesbymaggie.com',
    password: 'changeme',
    role: 'owner',
  },
]

await mongoose.connect(process.env.MONGO_URI)
console.log('Connected to MongoDB')

for (const { name, username, email, password, role } of SEED_USERS) {
  const existing = await User.findOne({ $or: [{ username }, { email }] })
  if (existing) {
    console.log(`  ⚠  ${username} already exists — skipping`)
    continue
  }
  const passwordHash = await bcrypt.hash(password, 12)
  await User.create({ name, username, email, passwordHash, role })
  console.log(`  ✓  Created ${role}: ${username}`)
}

await mongoose.disconnect()
console.log('Done.')
