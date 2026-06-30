const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')
const router = express.Router()

// Dashboard stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalProducts, totalOrders, totalUsers, recentOrders, lowStockProducts] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, email: true } } }
      }),
      prisma.product.findMany({
        where: {
          status: 'active',
        },
        select: {
          id: true,
          name: true,
          quantity: true,
          lowStockThreshold: true,
          featuredImageUrl: true,
        }
      })
    ])

    const lowStock = lowStockProducts.filter(
      p => p.quantity <= (p.lowStockThreshold || 5)
    )

    const revenue = await prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { paymentStatus: 'paid' }
    })

    // Revenue over last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentPaidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'paid',
        createdAt: { gte: sevenDaysAgo }
      },
      select: { grandTotal: true, createdAt: true }
    })

    const revenueByDay = {}
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      revenueByDay[key] = 0
    }

    recentPaidOrders.forEach(order => {
      const key = order.createdAt.toISOString().split('T')[0]
      if (revenueByDay[key] !== undefined) {
        revenueByDay[key] += parseFloat(order.grandTotal)
      }
    })

    const revenueChart = Object.entries(revenueByDay).map(([date, total]) => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: total
    }))

    res.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: revenue._sum.grandTotal || 0,
      recentOrders,
      lowStockProducts: lowStock,
      revenueChart
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