const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')
const { evaluateCoupon } = require('../utils/coupons')

const router = express.Router()

// GET all promotions
router.get('/', async (req, res, next) => {
  try {
    const { all } = req.query
    const where = all === 'true' ? {} : { isActive: true }
    
    const promotions = await prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(promotions)
  } catch (err) {
    next(err)
  }
})

// CREATE promotion
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const {
      name, type, value, couponCode, minimumOrder,
      startDate, endDate, appliesToAll, selectedProducts
    } = req.body

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    if (!['PERCENTAGE', 'FIXED'].includes(type)) {
      return res.status(400).json({ error: 'Type must be PERCENTAGE or FIXED' })
    }
    if (value === undefined || value === null || parseFloat(value) < 0) {
      return res.status(400).json({ error: 'Value must be a positive number' })
    }
    if (!startDate) return res.status(400).json({ error: 'Start date is required' })

    const promo = await prisma.promotion.create({
      data: {
        name: name.trim(),
        type,
        value: parseFloat(value),
        couponCode: couponCode?.trim().toUpperCase() || null,
        minimumOrder: parseFloat(minimumOrder) || 0,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
        appliesToAll: appliesToAll ?? true,
        productIds: selectedProducts || [],
      }
    })

    res.status(201).json(promo)
  } catch (err) {
    console.error('Create promotion error:', err)
    next(err)
  }
})

// UPDATE promotion
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const {
      name, type, value, couponCode, minimumOrder,
      startDate, endDate, appliesToAll, selectedProducts, isActive
    } = req.body

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    if (!['PERCENTAGE', 'FIXED'].includes(type)) {
      return res.status(400).json({ error: 'Type must be PERCENTAGE or FIXED' })
    }
    const numericValue = Number(value)
    const numericMinimum = Number(minimumOrder || 0)
    if (!Number.isFinite(numericValue) || numericValue <= 0 ||
      (type === 'PERCENTAGE' && numericValue > 100) ||
      !Number.isFinite(numericMinimum) || numericMinimum < 0) {
      return res.status(400).json({ error: 'Invalid promotion value' })
    }
    if (!startDate) return res.status(400).json({ error: 'Start date is required' })

    const promo = await prisma.promotion.update({
      where: { id: req.params.id },
      data: {
        name: name.trim(),
        type,
        value: numericValue,
        couponCode: couponCode?.trim().toUpperCase() || null,
        minimumOrder: numericMinimum,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        appliesToAll: appliesToAll ?? true,
        productIds: selectedProducts || [],
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      }
    })

    res.json(promo)
  } catch (err) {
    next(err)
  }
})

// VALIDATE coupon at checkout. Prices come from the database, not the client.
// Send items: [{ productId, quantity }]. (The old subtotal/productIds body is still
// accepted, but then eligibility can't be worked out per item.)
router.post('/validate', async (req, res, next) => {
  try {
    const { couponCode, subtotal, productIds = [], items } = req.body

    if (!couponCode?.trim()) {
      return res.status(400).json({ error: 'Coupon code is required' })
    }

    let promo = await prisma.promotion.findFirst({
      where: { couponCode: couponCode.trim().toUpperCase(), isActive: true }
    })
    if (!promo) return res.status(404).json({ error: 'Invalid coupon' })

    let cart
    if (Array.isArray(items) && items.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: items.map(i => i.productId) }, status: 'active' }
      })
      const byId = new Map(products.map(p => [p.id, p]))
      cart = []
      for (const item of items) {
        const product = byId.get(item.productId)
        const quantity = Number(item.quantity)
        if (!product || !Number.isInteger(quantity) || quantity <= 0) {
          return res.status(400).json({ error: 'Your cart has an item that is no longer available' })
        }
        cart.push({ productId: product.id, categoryId: product.categoryId, subtotal: Number(product.basePrice) * quantity })
      }
    } else {
      // Legacy shape (old storefront build): no per-item data, so the client's subtotal is
      // used and the coupon counts as applying if any listed product matches.
      if (!promo.appliesToAll && !productIds.some(id => (promo.productIds || []).includes(id))) {
        return res.status(400).json({ error: 'Coupon does not apply to these products' })
      }
      cart = [{ productId: 'legacy', subtotal: Number(subtotal) || 0 }]
      promo = { ...promo, appliesToAll: true }
    }

    const result = evaluateCoupon(promo, cart)
    if (!result.ok) return res.status(result.status).json({ error: result.error })

    res.json({
      valid: true,
      discount: result.discount,
      promo: {
        id: promo.id,
        name: promo.name,
        type: promo.type,
        value: promo.value,
        couponCode: promo.couponCode
      }
    })
  } catch (err) {
    next(err)
  }
})

// SOFT DELETE (deactivate)
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const promo = await prisma.promotion.update({
      where: { id: req.params.id },
      data: { isActive: false }
    })
    
    res.json({ message: 'Promotion deactivated', promo })
  } catch (err) {
    next(err)
  }
})

module.exports = router