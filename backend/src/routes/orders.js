const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

// CREATE ORDER
router.post('/', async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, userId, notes } = req.body
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' })
    }
    let subtotal = 0
    const orderItems = []
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product) return res.status(404).json({ error: `Product not found: ${item.productId}` })
      const itemSubtotal = parseFloat(product.basePrice) * item.quantity
      subtotal += itemSubtotal
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.basePrice,
        subtotal: itemSubtotal
      })
    }
    const orderNumber = `MMBW-${Date.now()}`
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        subtotal,
        grandTotal: subtotal,
        shippingAddress,
        paymentMethod,
        notes,
        items: { create: orderItems }
      },
      include: { items: true }
    })
    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET MY ORDERS
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET ALL ORDERS (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true, user: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// UPDATE ORDER STATUS (admin)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, paymentStatus }
    })
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router