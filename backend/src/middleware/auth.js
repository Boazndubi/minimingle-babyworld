const jwt = require('jsonwebtoken')

const getToken = (req) => {
  const cookieToken = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('access_token='))
  if (cookieToken) return decodeURIComponent(cookieToken.slice('access_token='.length))
  const authHeader = req.headers.authorization
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
}

const protect = (req, res, next) => {
  const token = getToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Not authorized' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

module.exports = { protect, adminOnly, getToken }