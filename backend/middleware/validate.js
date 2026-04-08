import mongoose from 'mongoose'

export const isValidId    = (id) => mongoose.Types.ObjectId.isValid(id)
export const isValidTime  = (t)  => /^\d{2}:\d{2}$/.test(t)
export const isValidDate  = (d)  => !isNaN(Date.parse(d))
export const isValidEmail = (e)  => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
// 7–15 digits, optional leading +, spaces/dashes/parens allowed
export const isValidPhone = (p)  => /^\+?[\d\s\-().]{7,20}$/.test(p) && p.replace(/\D/g, '').length >= 7
export const sanitizeStr  = (s, max = 500) =>
  typeof s === 'string' ? s.trim().slice(0, max) : ''
