const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')
const router = express.Router()

// Dashboard stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [totalProducts, totalOrders, totalUsers, recentOrders, lowStockProducts, activeProducts, itemsSoldTodayAgg] = await Promise.all([
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
      }),
      prisma.product.count({ where: { status: 'active' } }),
      prisma.orderItem.aggregate({
        _sum: { quantity: true },
        where: { order: { paymentStatus: 'paid', createdAt: { gte: todayStart } } },
      }),
    ])

    const itemsSoldToday = itemsSoldTodayAgg._sum.quantity || 0

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
      activeProducts,
      itemsSoldToday,
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

// ---------- Dashboard widgets (added for admin dashboard UI) ----------

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function startOfWeek(d = new Date()) {
  const x = startOfDay(d)
  const day = x.getDay()
  const diff = day === 0 ? 6 : day - 1 // Monday start
  x.setDate(x.getDate() - diff)
  return x
}
function startOfMonth(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function startOfYear(d = new Date()) { return new Date(d.getFullYear(), 0, 1) }
function pctChange(curr, prev) {
  if (prev === 0) return curr === 0 ? 0 : 100
  return Number((((curr - prev) / prev) * 100).toFixed(1))
}

async function periodSummary(where) {
  const orders = await prisma.order.findMany({ where, select: { grandTotal: true, paymentMethod: true } })
  const amount = orders.reduce((s, o) => s + parseFloat(o.grandTotal), 0)
  const byMethod = {}
  for (const o of orders) {
    const m = (o.paymentMethod || 'unknown').toLowerCase()
    byMethod[m] = (byMethod[m] || 0) + parseFloat(o.grandTotal)
  }
  return { amount, sales: orders.length, byMethod }
}

// Sales summary: today / yesterday / this week / this month / this year
router.get('/sales-summary', protect, adminOnly, async (req, res) => {
  try {
    const now = new Date()
    const todayStart = startOfDay(now)
    const yestStart = new Date(todayStart)
    yestStart.setDate(yestStart.getDate() - 1)
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)
    const yearStart = startOfYear(now)
    const paid = { paymentStatus: 'paid' }

    const [today, yesterday, thisWeek, thisMonth, thisYear] = await Promise.all([
      periodSummary({ ...paid, createdAt: { gte: todayStart } }),
      periodSummary({ ...paid, createdAt: { gte: yestStart, lt: todayStart } }),
      periodSummary({ ...paid, createdAt: { gte: weekStart } }),
      periodSummary({ ...paid, createdAt: { gte: monthStart } }),
      periodSummary({ ...paid, createdAt: { gte: yearStart } }),
    ])

    // Confirmed checkout values: "mpesa" and "card" (POS also uses "cash")
    res.json({
      today: { amount: today.amount, sales: today.sales, change: pctChange(today.amount, yesterday.amount), cash: today.byMethod.cash || 0 },
      yesterday: { amount: yesterday.amount, sales: yesterday.sales, cash: yesterday.byMethod.cash || 0 },
      thisWeek: { amount: thisWeek.amount, sales: thisWeek.sales, cash: thisWeek.byMethod.cash || 0 },
      thisMonth: {
        amount: thisMonth.amount, sales: thisMonth.sales,
        cash: thisMonth.byMethod.cash || 0,
        mobileMoney: (thisMonth.byMethod.mpesa || 0) + (thisMonth.byMethod.card || 0),
      },
      thisYear: {
        amount: thisYear.amount, sales: thisYear.sales,
        cash: thisYear.byMethod.cash || 0,
        mobileMoney: thisYear.byMethod.mpesa || 0,
        credit: 0,
        mpesa: thisYear.byMethod.mpesa || 0,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Profit summary: sales - cost of goods (no Expense model yet, so expenses is always 0)
router.get('/profit-summary', protect, adminOnly, async (req, res) => {
  try {
    const now = new Date()
    const ranges = {
      today: { gte: startOfDay(now) },
      yesterday: { gte: (() => { const d = startOfDay(now); d.setDate(d.getDate() - 1); return d })(), lt: startOfDay(now) },
      thisWeek: { gte: startOfWeek(now) },
      thisMonth: { gte: startOfMonth(now) },
      thisYear: { gte: startOfYear(now) },
    }
    const result = {}
    for (const [key, range] of Object.entries(ranges)) {
      const items = await prisma.orderItem.findMany({
        where: { order: { paymentStatus: 'paid', createdAt: range } },
        select: { quantity: true, subtotal: true, product: { select: { costPrice: true } } },
      })
      const sales = items.reduce((s, i) => s + parseFloat(i.subtotal), 0)
      const costOfGoods = items.reduce((s, i) => s + (i.product.costPrice ? parseFloat(i.product.costPrice) * i.quantity : 0), 0)
      result[key] = {
        amount: Number((sales - costOfGoods).toFixed(2)),
        sales: Number(sales.toFixed(2)),
        costOfGoods: -Number(costOfGoods.toFixed(2)),
        expenses: 0,
      }
    }
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 12-month revenue trend (for AnnualRevenueChart — distinct from the 7-day revenueChart above)
router.get('/revenue-trends', protect, adminOnly, async (req, res) => {
  try {
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
    twelveMonthsAgo.setDate(1)
    twelveMonthsAgo.setHours(0, 0, 0, 0)

    const orders = await prisma.order.findMany({
      where: { paymentStatus: 'paid', createdAt: { gte: twelveMonthsAgo } },
      select: { grandTotal: true, createdAt: true },
    })

    const months = []
    const cursor = new Date(twelveMonthsAgo)
    for (let i = 0; i < 12; i++) {
      months.push({ key: `${cursor.getFullYear()}-${cursor.getMonth()}`, month: cursor.toLocaleString('en-US', { month: 'short' }), revenue: 0 })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    const byKey = Object.fromEntries(months.map(m => [m.key, m]))
    for (const o of orders) {
      const key = `${o.createdAt.getFullYear()}-${o.createdAt.getMonth()}`
      if (byKey[key]) byKey[key].revenue += parseFloat(o.grandTotal)
    }
    res.json(months.map(({ month, revenue }) => ({ month, revenue: Number(revenue.toFixed(2)) })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Current week Mon-Sun (for WeeklySalesChart)
router.get('/weekly-sales', protect, adminOnly, async (req, res) => {
  try {
    const weekStart = startOfWeek(new Date())
    const items = await prisma.orderItem.findMany({
      where: { order: { paymentStatus: 'paid', createdAt: { gte: weekStart } } },
      select: { subtotal: true, quantity: true, order: { select: { createdAt: true } }, product: { select: { costPrice: true } } },
    })
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const totals = days.map(day => ({ day, sales: 0, profit: 0 }))
    for (const i of items) {
      const idx = (i.order.createdAt.getDay() + 6) % 7
      const sub = parseFloat(i.subtotal)
      const cost = i.product.costPrice ? parseFloat(i.product.costPrice) * i.quantity : 0
      totals[idx].sales += sub
      totals[idx].profit += sub - cost
    }
    res.json(totals.map(t => ({ day: t.day, sales: Number(t.sales.toFixed(2)), profit: Number(t.profit.toFixed(2)) })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Today's orders bucketed by hour (for PeakHoursChart)
router.get('/peak-hours', protect, adminOnly, async (req, res) => {
  try {
    const todayStart = startOfDay(new Date())
    const orders = await prisma.order.findMany({
      where: { paymentStatus: 'paid', createdAt: { gte: todayStart } },
      select: { grandTotal: true, createdAt: true },
    })
    const hours = Array.from({ length: 13 }, (_, i) => ({ hour: `${String(i + 8).padStart(2, '0')}:00`, sales: 0 })) // 08:00–20:00
    for (const o of orders) {
      const h = o.createdAt.getHours()
      const bucket = hours.find(b => parseInt(b.hour) === h)
      if (bucket) bucket.sales += parseFloat(o.grandTotal)
    }
    res.json(hours.map(h => ({ hour: h.hour, sales: Number(h.sales.toFixed(2)) })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Payment method breakdown, year to date (for PaymentMethodsChart)
router.get('/payment-breakdown', protect, adminOnly, async (req, res) => {
  try {
    const yearStart = startOfYear(new Date())
    const { byMethod } = await periodSummary({ paymentStatus: 'paid', createdAt: { gte: yearStart } })
    // Confirmed values: checkout sends "mpesa" and "card" (POS also sends "cash")
    const colors = { cash: '#3b82f6', mpesa: '#8b5cf6', card: '#10b981', unknown: '#6b7280' }
    const labels = { cash: 'Cash', mpesa: 'M-Pesa', card: 'Card (Pesapal)', unknown: 'Other' }
    res.json(Object.entries(byMethod).map(([method, value]) => ({
      name: labels[method] || method,
      value: Number(value.toFixed(2)),
      color: colors[method] || '#6b7280',
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Best sellers, last 30 days (for TopProducts)
router.get('/top-products', protect, adminOnly, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const items = await prisma.orderItem.findMany({
      where: { order: { paymentStatus: 'paid', createdAt: { gte: thirtyDaysAgo } } },
      select: { subtotal: true, product: { select: { name: true } } },
    })
    // "sales" here is revenue (matches the UI's formatCurrency display), not unit count
    const totals = {}
    for (const i of items) {
      totals[i.product.name] = (totals[i.product.name] || 0) + parseFloat(i.subtotal)
    }
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const max = sorted[0]?.[1] || 1
    res.json(sorted.map(([name, sales]) => ({ name, sales: Number(sales.toFixed(2)), percentage: Math.round((sales / max) * 100) })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Recent sales formatted for the RecentSales widget (cashier = customer name for in-store,
// "Online" for web orders — you have no Staff/cashier model, so this is the closest available)
router.get('/recent-sales', protect, adminOnly, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { paymentStatus: 'paid' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, orderNumber: true, grandTotal: true, paymentMethod: true,
        channel: true, createdAt: true, shippingAddress: true,
        user: { select: { firstName: true, lastName: true } },
      },
    })
    res.json(orders.map(o => ({
      id: o.orderNumber,
      cashier: o.channel === 'in_store'
        ? (o.shippingAddress?.name || 'Walk-in Customer')
        : (o.user ? `${o.user.firstName || ''} ${o.user.lastName || ''}`.trim() || 'Online Customer' : 'Guest'),
      method: o.paymentMethod || 'unknown',
      amount: parseFloat(o.grandTotal),
      time: o.createdAt,
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router