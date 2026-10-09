const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')
const {
  sendOrderConfirmationSMS,
  sendAdminNewOrderSMS,
  sendOrderStatusSMS
} = require('../services/smsService')
const {
  sendPaidOrderEmails,
  sendOrderStatusEmail
} = require('../services/emailService')

const { getDeliveryFee } = require('../utils/delivery')
const { evaluateCoupon } = require('../utils/coupons')
const { releaseOrderHolds } = require('../utils/orderPayments')

const router = express.Router()

// Set ADMIN_PHONE in the environment; the old number stays as a fallback.
const ADMIN_PHONE = process.env.ADMIN_PHONE || '+254112815454'


// GET DELIVERY ZONES (public - used by storefront checkout to display fees)
router.get('/delivery-zones', async (req, res) => {
  try {
    const zones = await prisma.deliveryZone.findMany({ orderBy: { city: 'asc' } })
    res.json(zones)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// CREATE ORDER (online store)
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode, notes } = req.body
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' })
    }

    // Guest checkout is allowed, but if a session token is present (httpOnly
    // cookie from the storefront, or a Bearer header) the order is linked to
    // that user so it shows up in "My orders".
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0
      const orderItems = []
      const couponItems = []

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
        couponItems.push({ productId: product.id, categoryId: product.categoryId, subtotal: itemSubtotal })
      }

      let discountTotal = 0
      let appliedCouponCode = null
      if (couponCode?.trim()) {
        const promo = await tx.promotion.findFirst({
          where: { couponCode: couponCode.trim().toUpperCase(), isActive: true }
        })
        const result = evaluateCoupon(promo, couponItems)
        if (!result.ok) throw Object.assign(new Error(result.error), { statusCode: result.status })
        discountTotal = result.discount

        // Claim a use atomically so two simultaneous orders can't both take the last one.
        const claimed = await tx.promotion.updateMany({
          where: {
            id: promo.id,
            ...(promo.usageLimit !== null ? { usageCount: { lt: promo.usageLimit } } : {})
          },
          data: { usageCount: { increment: 1 } }
        })
        if (claimed.count !== 1) {
          throw Object.assign(new Error('Coupon usage limit reached'), { statusCode: 400 })
        }
        appliedCouponCode = promo.couponCode
      }

      const orderNumber = `MMBW-${Date.now()}`
      const shippingTotal = await getDeliveryFee(shippingAddress?.city)
      return tx.order.create({
        data: {
          orderNumber,
          userId: req.user.id,
          subtotal,
          discountTotal,
          shippingTotal,
          grandTotal: subtotal - discountTotal + shippingTotal,
          shippingAddress,
          paymentMethod,
          notes,
          couponCode: appliedCouponCode,
          channel: 'online',
          items: { create: orderItems }
        },
        include: { items: true }
      })
    })

    // Send SMS notifications (non-blocking)
    sendOrderConfirmationSMS(order).catch(err => console.error('Customer SMS error:', err))
    sendAdminNewOrderSMS(order, ADMIN_PHONE).catch(err => console.error('Admin SMS error:', err))

    res.status(201).json(order)
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message })
  }
})

// CREATE IN-STORE ORDER (POS)
router.post('/pos', protect, adminOnly, async (req, res) => {
  try {
    const { items, paymentMethod, customerName, customerPhone } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' })
    }

    // Everything happens in one transaction with an atomic stock decrement, so two
    // simultaneous sales (or a failure halfway through) can't oversell or leave
    // stock reduced without an order.
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0
      const orderItems = []

      for (const item of items) {
        const quantity = Number(item.quantity)
        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw Object.assign(new Error('Invalid item quantity'), { statusCode: 400 })
        }
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw Object.assign(new Error(`Product not found: ${item.productId}`), { statusCode: 404 })

        const reserved = await tx.product.updateMany({
          where: { id: item.productId, quantity: { gte: quantity } },
          data: { quantity: { decrement: quantity } }
        })
        if (reserved.count !== 1) {
          throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { statusCode: 400 })
        }
        const itemSubtotal = Number(product.basePrice) * quantity
        subtotal += itemSubtotal
        orderItems.push({ productId: product.id, quantity, unitPrice: product.basePrice, subtotal: itemSubtotal })
      }

      const isPaid = paymentMethod !== 'mpesa'
      return tx.order.create({
        data: {
          orderNumber: `MMBW-POS-${Date.now()}`,
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
    })

    res.status(201).json(order)
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message })
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
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
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// GET ALL ORDERS (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    // Bounded so the list can't grow without limit; ?limit=&page= to page through.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 500)
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        include: { items: { include: { product: true } }, user: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.order.count()
    ])
    res.set('X-Total-Count', String(total))
    res.json(orders)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
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
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
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
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
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
      if (order.paymentStatus === 'paid') {
        sendOrderStatusEmail(order, status).catch(err => console.error('Status email error:', err))
      }
    }

    res.json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// REFUND ORDER (admin). Only paid orders can be refunded. Unpaid orders that were
// cancelled or expired already had their stock released, so refunding them would
// put the stock back a second time.
router.post('/:id/refund', protect, adminOnly, async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { id: req.params.id }, include: { items: true } })
      if (!existing) return { notFound: true }
      if (existing.paymentStatus === 'refunded') return { order: existing }
      if (existing.paymentStatus !== 'paid') return { notPaid: true }

      // Guarded so two simultaneous refund clicks restore stock only once.
      const claimed = await tx.order.updateMany({
        where: { id: existing.id, paymentStatus: 'paid' },
        data: {
          paymentStatus: 'refunded',
          status: 'cancelled',
          notes: `${existing.notes || ''}\nRefunded: ${req.body.reason || 'Admin refund'}`.trim()
        }
      })
      if (claimed.count === 1) await releaseOrderHolds(tx, existing)
      return { order: await tx.order.findUnique({ where: { id: existing.id }, include: { items: true } }) }
    })
    if (result.notFound) return res.status(404).json({ error: 'Order not found' })
    if (result.notPaid) return res.status(409).json({ error: 'Only paid orders can be refunded' })
    res.json(result.order)
  } catch (err) {
    console.error('Refund error:', err)
    res.status(500).json({ error: 'Unable to refund order' })
  }
})

module.exports = router
