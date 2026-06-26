const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

// Dashboard stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalProducts, totalOrders, totalUsers, recentOrders] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, email: true } } }
      })
    ])
    const revenue = await prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { paymentStatus: 'paid' }
    })
    res.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: revenue._sum.grandTotal || 0,
      recentOrders
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Make user admin
router.put('/users/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: req.body.role }
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router