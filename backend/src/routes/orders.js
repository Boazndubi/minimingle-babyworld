const express = require('express')
const jwt = require('jsonwebtoken')
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

function getDeliveryFee(city) {
  return String(city || '').trim().toLowerCase() === 'nairobi' ? 200 : 500
}

// CREATE ORDER (online store)
router.post('/', async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode, notes } = req.body
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' })
    }

    let authenticatedUserId = null
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      try {
        authenticatedUserId = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET).id
      } catch {
        return res.status(401).json({ error: 'Token invalid or expired' })
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0
      const orderItems = []

      for (const item of items) {
        const quantity = Number(item.quantity)
        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw Object.assign(new Error('Invalid item quantity'), { statusCode: 400 })
        }
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product || product.status !== 'active') {
          throw Object.assign(new Error(`Product not found: ${item.productId}`), { statusCode: 404 })
        }
        const reserved = await tx.product.updateMany({
          where: { id: item.productId, status: 'active', quantity: { gte: quantity } },
          data: { quantity: { decrement: quantity } }
        })
        if (reserved.count !== 1) {
          throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { statusCode: 409 })
        }
        const itemSubtotal = Number(product.basePrice) * quantity
        subtotal += itemSubtotal
        orderItems.push({ productId: product.id, quantity, unitPrice: product.basePrice, subtotal: itemSubtotal })
      }

      let discountTotal = 0
      if (couponCode?.trim()) {
        const promo = await tx.promotion.findFirst({
          where: { couponCode: couponCode.trim().toUpperCase(), isActive: true }
        })
        const now = new Date()
        if (!promo || (promo.startDate && now < promo.startDate) || (promo.endDate && now > promo.endDate) ||
          (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit)) {
          throw Object.assign(new Error('Invalid or expired coupon'), { statusCode: 400 })
        }
        if (subtotal < Number(promo.minimumOrder)) {
          throw Object.assign(new Error(`Minimum order is KES ${promo.minimumOrder}`), { statusCode: 400 })
        }
        const applies = promo.appliesToAll || orderItems.some(item => promo.productIds.includes(item.productId))
        if (!applies) throw Object.assign(new Error('Coupon does not apply to these products'), { statusCode: 400 })
        discountTotal = Math.min(
          promo.type === 'PERCENTAGE' ? subtotal * (Number(promo.value) / 100) : Number(promo.value),
          subtotal
        )
        await tx.promotion.update({ where: { id: promo.id }, data: { usageCount: { increment: 1 } } })
      }

      const orderNumber = `MMBW-${Date.now()}`
      const shippingTotal = getDeliveryFee(shippingAddress?.city)
      return tx.order.create({
        data: {
          orderNumber,
          userId: authenticatedUserId,
          subtotal,
          discountTotal,
          shippingTotal,
          grandTotal: subtotal - discountTotal + shippingTotal,
          shippingAddress,
          paymentMethod,
          notes,
          channel: 'online',
          items: { create: orderItems }
        },
        include: { items: true }
      })
    })

    // Send SMS notifications (non-blocking)
    sendOrderConfirmationSMS(order).catch(err => console.error('Customer SMS error:', err))
    sendAdminNewOrderSMS(order, ADMIN_PHONE).catch(err => console.error('Admin SMS error:', err))

    // Send email notifications (non-blocking)
    sendOrderConfirmationEmail(order).catch(err => console.error('Customer email error:', err))
    sendAdminNewOrderEmail(order).catch(err => console.error('Admin email error:', err))

    res.status(201).json(order)
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message })
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

// TRACK ORDER (public, no auth — by orderNumber)
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const phone = String(req.query.phone || '').replace(/\D/g, '')
    if (!phone) return res.status(400).json({ error: 'Phone number is required' })
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber.trim() },
      include: { items: { include: { product: true } } }
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    const orderPhone = String(order.shippingAddress?.phone || '').replace(/\D/g, '')
    if (!orderPhone || orderPhone !== phone) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
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
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'expired', 'refunded']
    if (status !== undefined && !validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid order status' })
    if (paymentStatus !== undefined && !validPaymentStatuses.includes(paymentStatus)) return res.status(400).json({ error: 'Invalid payment status' })
    if (status === undefined && paymentStatus === undefined) return res.status(400).json({ error: 'A status value is required' })

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

// REFUND ORDER (admin). Stock is restored once when the order is refunded.
router.post('/:id/refund', protect, adminOnly, async (req, res) => {
  try {
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { id: req.params.id }, include: { items: true } })
      if (!existing) return null
      if (existing.paymentStatus === 'refunded') return existing
      for (const item of existing.items) {
        await tx.product.update({ where: { id: item.productId }, data: { quantity: { increment: item.quantity } } })
      }
      return tx.order.update({
        where: { id: existing.id },
        data: { paymentStatus: 'refunded', status: 'cancelled', notes: `${existing.notes || ''}\nRefunded: ${req.body.reason || 'Admin refund'}`.trim() },
        include: { items: true },
      })
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: 'Unable to refund order' })
  }
})

module.exports = router