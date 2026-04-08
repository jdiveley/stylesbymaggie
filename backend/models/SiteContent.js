import mongoose from 'mongoose'

// Each document = one editable piece of copy.
// `key` is the stable identifier used in frontend; `value` is the editable text.
const siteContentSchema = new mongoose.Schema({
  key:     { type: String, required: true, unique: true, trim: true },
  value:   { type: String, default: '' },
  label:   { type: String, required: true },          // human-readable name shown in editor
  type:    { type: String, enum: ['text', 'textarea'], default: 'text' },
  section: { type: String, required: true },           // groups keys in the editor UI
  order:   { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.model('SiteContent', siteContentSchema)
