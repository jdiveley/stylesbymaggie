/**
 * Seed script — creates default accounts, stylist profiles, and services.
 * Safe to re-run: skips records that already exist.
 * Usage: node seed.js
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from './models/User.js'
import Stylist from './models/Stylist.js'
import Service from './models/Service.js'

// ── Users ─────────────────────────────────────────────────────────────
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

// ── Services ──────────────────────────────────────────────────────────
const SEED_SERVICES = [
  { name: "Women's Haircut", description: 'Precision cut with blow dry and style finish', priceCents: 6500, durationMinutes: 60, category: 'cut', displayOrder: 0 },
  { name: "Men's Haircut", description: 'Classic cut with wash and style', priceCents: 3500, durationMinutes: 30, category: 'cut', displayOrder: 1 },
  { name: 'Blowout', description: 'Wash and professional blow dry styling', priceCents: 4500, durationMinutes: 45, category: 'styling', displayOrder: 2 },
  { name: 'Full Color', description: 'Single process all-over hair color', priceCents: 12000, durationMinutes: 120, category: 'color', displayOrder: 3 },
  { name: 'Highlights', description: 'Partial or full highlights for dimension', priceCents: 15000, durationMinutes: 150, category: 'color', displayOrder: 4 },
  { name: 'Balayage', description: 'Hand-painted highlights for a sun-kissed look', priceCents: 18000, durationMinutes: 180, category: 'color', displayOrder: 5 },
  { name: 'Deep Conditioning', description: 'Intensive moisture treatment for all hair types', priceCents: 4000, durationMinutes: 30, category: 'treatment', displayOrder: 6 },
  { name: 'Keratin Treatment', description: 'Smoothing treatment for frizz-free, shiny hair', priceCents: 25000, durationMinutes: 180, category: 'treatment', displayOrder: 7 },
]

await mongoose.connect(process.env.MONGO_URI)
console.log('Connected to MongoDB')

// ── Seed users ────────────────────────────────────────────────────────
for (const { name, username, email, password, role } of SEED_USERS) {
  const existing = await User.findOne({ $or: [{ username }, { email }] })
  if (existing) {
    // Update role in case it changed (e.g. stylist → owner)
    if (existing.role !== role) {
      await User.findByIdAndUpdate(existing._id, { role })
      console.log(`  ↑  Updated ${username} role to ${role}`)
    } else {
      console.log(`  ⚠  ${username} already exists — skipping`)
    }
    continue
  }
  const passwordHash = await bcrypt.hash(password, 12)
  await User.create({ name, username, email, passwordHash, role })
  console.log(`  ✓  Created ${role}: ${username}`)
}

// ── Seed Maggie's stylist profile ─────────────────────────────────────
const maggie = await User.findOne({ username: 'maggie' })
if (maggie) {
  const existingStylist = await Stylist.findOne({ userId: maggie._id })
  if (existingStylist) {
    console.log('  ⚠  Maggie stylist profile already exists — skipping')
  } else {
    await Stylist.create({
      userId: maggie._id,
      bio: 'Owner and lead stylist at Styles by Maggie. Specializing in color and precision cuts.',
      specialties: ['Color', 'Balayage', 'Precision Cuts', 'Keratin Treatments'],
      workingDays: [1, 2, 3, 4, 5], // Mon–Fri
      workingHours: { start: '09:00', end: '17:00' },
    })
    console.log('  ✓  Created stylist profile for Maggie')
  }
}

// ── Seed services ─────────────────────────────────────────────────────
const serviceCount = await Service.countDocuments()
if (serviceCount > 0) {
  console.log(`  ⚠  ${serviceCount} services already exist — skipping`)
} else {
  await Service.insertMany(SEED_SERVICES)
  console.log(`  ✓  Created ${SEED_SERVICES.length} services`)
}

await mongoose.disconnect()
console.log('Done.')
