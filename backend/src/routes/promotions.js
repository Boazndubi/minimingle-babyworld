const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { all } = req.query
    const where = all ? {} : { isActive: true }
    const promotions = await prisma.promotion.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json(promotions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      name, type, value, couponCode, minimumOrder,
      startDate, endDate, appliesToAll, selectedProducts
    } = req.body

    const promo = await prisma.promotion.create({
      data: {
        name,
        type,
        value,
        couponCode: couponCode || null,
        minimumOrder: minimumOrder || 0,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        appliesToAll: appliesToAll ?? true,
        productIds: selectedProducts || [],
      }
    })

    res.status(201).json(promo)
  } catch (err) {
    console.error('Create promotion error:', err)
    res.status(500).json({ error: err.message })
  }
})

router.post('/validate', async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body
    const promo = await prisma.promotion.findUnique({ where: { couponCode } })
    if (!promo || !promo.isActive) return res.status(404).json({ error: 'Invalid coupon' })
    if (promo.endDate && new Date() > promo.endDate) return res.status(400).json({ error: 'Coupon expired' })
    if (subtotal < parseFloat(promo.minimumOrder)) {
      return res.status(400).json({ error: `Minimum order is KES ${promo.minimumOrder}` })
    }
    const discount = promo.type === 'PERCENTAGE'
      ? subtotal * (parseFloat(promo.value) / 100)
      : parseFloat(promo.value)
    res.json({ valid: true, discount: Math.min(discount, subtotal), promo })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await prisma.promotion.delete({ where: { id: req.params.id } })
    res.json({ message: 'Promotion deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router