import { Router } from 'express'
import SiteContent from '../models/SiteContent.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { sanitizeStr } from '../middleware/validate.js'

const router = Router()

// Default content — seeded on first request if the collection is empty
const DEFAULTS = [
  // ── Home ──────────────────────────────────────────────────────────────────
  { section: 'Home', order: 0, key: 'home_tagline',           type: 'textarea', label: 'Hero Tagline',           value: 'A boutique salon experience where every cut, color, and treatment is crafted with intention — and a little magic.' },
  { section: 'Home', order: 1, key: 'home_hours',             type: 'text',     label: 'Business Hours',          value: 'Mon – Sat  ·  9am – 7pm' },
  { section: 'Home', order: 2, key: 'home_hours_note',        type: 'text',     label: 'Hours Note',              value: 'By Appointment · Walk-ins Welcome' },
  { section: 'Home', order: 3, key: 'home_about_heading',     type: 'text',     label: 'About Strip Heading',     value: 'Beautiful hair starts with listening.' },
  { section: 'Home', order: 4, key: 'home_about_body',        type: 'textarea', label: 'About Strip Body',        value: 'Maggie built this salon on a simple belief: that great hair comes from understanding each client\'s life, style, and vision — not just their hair type. Every appointment is a collaboration.' },
  { section: 'Home', order: 5, key: 'home_stat_1',            type: 'text',     label: 'Stat 1 (value · label)',  value: '10+ · Years of experience' },
  { section: 'Home', order: 6, key: 'home_stat_2',            type: 'text',     label: 'Stat 2 (value · label)',  value: '500+ · Happy clients' },
  { section: 'Home', order: 7, key: 'home_stat_3',            type: 'text',     label: 'Stat 3 (value · label)',  value: '8 · Signature services' },
  { section: 'Home', order: 8, key: 'home_stat_4',            type: 'text',     label: 'Stat 4 (value · label)',  value: '★★★★★ · Client rated' },

  // ── About ─────────────────────────────────────────────────────────────────
  { section: 'About', order: 0, key: 'about_hero_heading',    type: 'text',     label: 'Page Heading',            value: 'Meet Maggie' },
  { section: 'About', order: 1, key: 'about_hero_sub',        type: 'text',     label: 'Page Subheading',         value: 'Stylist · Colorist · Salon Owner' },
  { section: 'About', order: 2, key: 'about_bio_p1',          type: 'textarea', label: 'Bio — Paragraph 1',       value: 'Maggie has been transforming hair and building confidence for over a decade. After training at the Aveda Institute and working in top salons across Chicago and Nashville, she opened Styles by Maggie to create a space that feels as personal as the work she does.' },
  { section: 'About', order: 3, key: 'about_bio_p2',          type: 'textarea', label: 'Bio — Paragraph 2',       value: 'She specializes in lived-in color, precision cuts, and the kind of blowout that makes you feel like a different person. Her approach is always collaborative — she listens first, then creates.' },
  { section: 'About', order: 4, key: 'about_bio_p3',          type: 'textarea', label: 'Bio — Paragraph 3',       value: 'When she\'s not behind the chair, you\'ll find her hiking with her dog, obsessing over color theory, and drinking too much coffee. She believes beautiful hair should feel effortless — and that a great appointment should feel like catching up with a friend.' },
  { section: 'About', order: 5, key: 'about_philosophy_heading', type: 'text',  label: 'Philosophy Heading',      value: 'The Philosophy' },
  { section: 'About', order: 6, key: 'about_philosophy_body', type: 'textarea', label: 'Philosophy Body',         value: 'Great hair isn\'t just about technique — it\'s about trust. Maggie takes the time to understand your lifestyle, your maintenance routine, and what "low maintenance" actually means to you. Every service is tailored, never templated.' },
  { section: 'About', order: 7, key: 'about_credential_1',    type: 'text',     label: 'Credential 1',            value: 'Aveda Institute — Certified Colorist' },
  { section: 'About', order: 8, key: 'about_credential_2',    type: 'text',     label: 'Credential 2',            value: '10+ Years Behind the Chair' },
  { section: 'About', order: 9, key: 'about_credential_3',    type: 'text',     label: 'Credential 3',            value: 'Balayage & Color Correction Specialist' },
  { section: 'About', order: 10, key: 'about_credential_4',   type: 'text',     label: 'Credential 4',            value: 'Keratin & Smoothing Treatment Certified' },

  // ── Contact ───────────────────────────────────────────────────────────────
  { section: 'Contact', order: 0, key: 'contact_intro',       type: 'textarea', label: 'Page Intro',              value: 'We\'d love to hear from you. Reach out to book, ask a question, or just say hello.' },
  { section: 'Contact', order: 1, key: 'contact_address',     type: 'text',     label: 'Address',                 value: '123 Maple Ave, Suite 4, Nashville, TN 37201' },
  { section: 'Contact', order: 2, key: 'contact_phone',       type: 'text',     label: 'Phone',                   value: '(615) 555-0142' },
  { section: 'Contact', order: 3, key: 'contact_email',       type: 'text',     label: 'Email',                   value: 'hello@stylesbymaggie.com' },
  { section: 'Contact', order: 4, key: 'contact_hours_wk',    type: 'text',     label: 'Hours — Mon–Fri',         value: 'Monday – Friday: 9am – 7pm' },
  { section: 'Contact', order: 5, key: 'contact_hours_sat',   type: 'text',     label: 'Hours — Saturday',        value: 'Saturday: 9am – 5pm' },
  { section: 'Contact', order: 6, key: 'contact_hours_sun',   type: 'text',     label: 'Hours — Sunday',          value: 'Sunday: Closed' },
  { section: 'Contact', order: 7, key: 'contact_parking',     type: 'text',     label: 'Parking / Access Note',   value: 'Free parking available in the rear lot. Street parking on Maple Ave.' },

  // ── Feedback ──────────────────────────────────────────────────────────────
  { section: 'Feedback', order: 0, key: 'feedback_heading',   type: 'text',     label: 'Page Heading',            value: 'Share Your Experience' },
  { section: 'Feedback', order: 1, key: 'feedback_intro',     type: 'textarea', label: 'Page Intro',              value: 'Your feedback helps us grow and improve. Whether your visit was everything you hoped for or left something to be desired, we want to hear about it — honestly.' },
  { section: 'Feedback', order: 2, key: 'feedback_thankyou',  type: 'textarea', label: 'Thank-You Message',       value: 'Thank you so much for taking the time to share your thoughts. We read every submission and take every word seriously. See you at your next appointment!' },
]

async function seedIfEmpty() {
  const count = await SiteContent.countDocuments()
  if (count === 0) {
    await SiteContent.insertMany(DEFAULTS)
  }
}

// GET /api/content — public; returns { key: value, ... }
router.get('/', async (req, res, next) => {
  try {
    await seedIfEmpty()
    const docs = await SiteContent.find().sort({ section: 1, order: 1 })
    const map = {}
    docs.forEach((d) => { map[d.key] = d.value })
    res.json(map)
  } catch (err) {
    next(err)
  }
})

// GET /api/content/schema — owner/admin; returns full docs for editor UI
router.get('/schema', requireAuth, requireRole('admin', 'owner'), async (req, res, next) => {
  try {
    await seedIfEmpty()
    const docs = await SiteContent.find().sort({ section: 1, order: 1 })
    res.json(docs)
  } catch (err) {
    next(err)
  }
})

// PUT /api/content — owner/admin; body: { key: newValue, ... }
router.put('/', requireAuth, requireRole('admin', 'owner'), async (req, res, next) => {
  try {
    const updates = req.body
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ message: 'Body must be a key/value object' })
    }

    const ops = Object.entries(updates).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { $set: { value: sanitizeStr(String(value ?? ''), 5000) } },
      },
    }))

    if (ops.length === 0) return res.status(400).json({ message: 'No fields to update' })
    await SiteContent.bulkWrite(ops)
    res.json({ message: 'Content updated' })
  } catch (err) {
    next(err)
  }
})

export default router
