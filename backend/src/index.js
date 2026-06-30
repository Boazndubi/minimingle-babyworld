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

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/promotions', promotionRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/mpesa', mpesaRoutes)
app.use('/api/admin', adminRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'MiniMingleBabyWorld API is running' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})