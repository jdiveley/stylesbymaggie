import jwt from 'jsonwebtoken'

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' })
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' })
  }
  next()
}
