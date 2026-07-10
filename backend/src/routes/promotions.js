const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')

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

// VALIDATE coupon at checkout
router.post('/validate', async (req, res, next) => {
  try {
    const { couponCode, subtotal } = req.body
    
    if (!couponCode?.trim()) {
      return res.status(400).json({ error: 'Coupon code is required' })
    }

    const promo = await prisma.promotion.findFirst({
      where: {
        couponCode: couponCode.trim().toUpperCase(),
        isActive: true
      }
    })

    if (!promo) return res.status(404).json({ error: 'Invalid coupon' })
    
    const now = new Date()
    if (promo.startDate && now < promo.startDate) {
      return res.status(400).json({ error: 'Coupon not yet active' })
    }
    if (promo.endDate && now > promo.endDate) {
      return res.status(400).json({ error: 'Coupon expired' })
    }
    if (subtotal < promo.minimumOrder) {
      return res.status(400).json({ 
        error: `Minimum order is KES ${promo.minimumOrder}` 
      })
    }

    const discount = promo.type === 'PERCENTAGE'
      ? subtotal * (promo.value / 100)
      : promo.value

    res.json({ 
      valid: true, 
      discount: Math.min(discount, subtotal), 
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