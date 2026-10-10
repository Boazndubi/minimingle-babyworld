const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.productId, isApproved: true },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' }
    })
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1)
    res.json({ reviews, averageRating: avg.toFixed(1), total: reviews.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

router.get('/product/:productId/eligibility', protect, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        userId: req.user.id,
        paymentStatus: 'paid',
        confirmedAt: { not: null },
        status: { not: 'cancelled' },
        items: { some: { productId: req.params.productId } }
      },
      select: { id: true }
    })
    res.json({ eligible: Boolean(order) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

router.post('/', protect, async (req, res) => {
  try {
    const { productId, rating, title, body } = req.body
    if (!productId || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: 'Product and rating from 1 to 5 are required' })
    }
    const order = await prisma.order.findFirst({
      where: {
        userId: req.user.id,
        paymentStatus: 'paid',
        confirmedAt: { not: null },
        status: { not: 'cancelled' },
        items: { some: { productId } }
      },
      select: { id: true }
    })
    if (!order) {
      return res.status(403).json({ error: 'You can review this product after your payment is confirmed' })
    }
    const review = await prisma.review.create({
      data: {
        productId,
        rating: Number(rating),
        title: typeof title === 'string' ? title.trim() || null : null,
        body: typeof body === 'string' ? body.trim() || null : null,
        userId: req.user.id,
        isVerifiedPurchase: true
      }
    })
    res.status(201).json(review)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

router.put('/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: true }
    })
    res.json(review)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

module.exports = router