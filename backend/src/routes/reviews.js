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
    res.status(500).json({ error: err.message })
  }
})

router.post('/', protect, async (req, res) => {
  try {
    const review = await prisma.review.create({
      data: { ...req.body, userId: req.user.id }
    })
    res.status(201).json(review)
  } catch (err) {
    res.status(500).json({ error: err.message })
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
    res.status(500).json({ error: err.message })
  }
})

module.exports = router