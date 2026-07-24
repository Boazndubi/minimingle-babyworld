const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')
const {
  sendOrderConfirmationSMS,
  sendAdminNewOrderSMS,
  sendOrderStatusSMS
} = require('../services/smsService')
const {
  sendOrderConfirmationEmail,
  sendAdminNewOrderEmail,
  sendOrderStatusEmail
} = require('../services/emailService')

const router = express.Router()

const ADMIN_PHONE = '+254112815454'

// CREATE ORDER (online store)
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
        channel: 'online',
        items: { create: orderItems }
      },
      include: { items: true }
    })

    // Send SMS notifications (non-blocking)
    sendOrderConfirmationSMS(order).catch(err => console.error('Customer SMS error:', err))
    sendAdminNewOrderSMS(order, ADMIN_PHONE).catch(err => console.error('Admin SMS error:', err))

    // Send email notifications (non-blocking)
    sendOrderConfirmationEmail(order).catch(err => console.error('Customer email error:', err))
    sendAdminNewOrderEmail(order).catch(err => console.error('Admin email error:', err))

    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// CREATE IN-STORE ORDER (POS)
router.post('/pos', protect, adminOnly, async (req, res) => {
  try {
    const { items, paymentMethod, customerName, customerPhone } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' })
    }

    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product) return res.status(404).json({ error: `Product not found: ${item.productId}` })
      if (product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` })
      }
      const itemSubtotal = parseFloat(product.basePrice) * item.quantity
      subtotal += itemSubtotal
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.basePrice,
        subtotal: itemSubtotal
      })

      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } }
      })
    }

    const orderNumber = `MMBW-POS-${Date.now()}`
    const isPaid = paymentMethod !== 'mpesa'

    const order = await prisma.order.create({
      data: {
        orderNumber,
        subtotal,
        grandTotal: subtotal,
        shippingAddress: {
          name: customerName || 'Walk-in Customer',
          phone: customerPhone || '',
        },
        paymentMethod,
        paymentStatus: isPaid ? 'paid' : 'pending',
        status: isPaid ? 'delivered' : 'confirmed',
        channel: 'in_store',
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
      include: { items: { include: { product: true } }, user: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET SINGLE ORDER (admin)
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true } }, user: true }
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
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
      data: { status, paymentStatus },
      include: { items: true }
    })

    // Send status update notifications to customer (non-blocking)
    if (status) {
      sendOrderStatusSMS(order, status).catch(err => console.error('Status SMS error:', err))
      sendOrderStatusEmail(order, status).catch(err => console.error('Status email error:', err))
    }

    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router