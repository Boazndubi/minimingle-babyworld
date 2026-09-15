const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/products')
const categoryRoutes = require('./routes/categories')
const orderRoutes = require('./routes/orders')
const reviewRoutes = require('./routes/reviews')
const wishlistRoutes = require('./routes/wishlist')
const promotionRoutes = require('./routes/promotions')
const uploadRoutes = require('./routes/upload')
const mpesaRoutes = require('./routes/mpesa')
const adminRoutes = require('./routes/admin')
const pesapalRoutes = require('./routes/pesapal')
const { expirePendingOrders } = require('./jobs/expirePendingOrders')

const app = express()
const PORT = process.env.PORT || 5000
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',').map(origin => origin.trim()).filter(Boolean)

const rateLimit = (windowMs, max) => {
  const clients = new Map()
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    const current = clients.get(key)
    if (!current || now - current.startedAt >= windowMs) {
      clients.set(key, { startedAt: now, count: 1 })
      return next()
    }
    current.count += 1
    if (current.count > max) return res.status(429).json({ error: 'Too many requests. Try again later.' })
    next()
  }
}

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// Routes
app.use('/api/auth', rateLimit(15 * 60 * 1000, 30), authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/promotions', promotionRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/mpesa', rateLimit(60 * 1000, 20), mpesaRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/pesapal', pesapalRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'MiniMingleBabyWorld API is running' })
})

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use((err, req, res, next) => {
  console.error(`${req.method} ${req.originalUrl}`, err)
  if (res.headersSent) return next(err)
  res.status(err.statusCode || 500).json({ error: 'An unexpected server error occurred.' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  expirePendingOrders().catch(err => console.error('Pending order expiry error:', err))
  setInterval(() => expirePendingOrders().catch(err => console.error('Pending order expiry error:', err)), 5 * 60 * 1000)
})