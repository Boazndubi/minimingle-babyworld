const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

// GET ALL PRODUCTS (with filters)
router.get('/', async (req, res) => {
  try {
    const { category, milestone, minPrice, maxPrice, sort, page = 1, limit = 24, search } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = { status: 'active' }
    if (category) where.category = { slug: category }
    if (milestone) where.milestoneTags = { has: milestone }
    if (minPrice || maxPrice) {
      where.basePrice = {}
      if (minPrice) where.basePrice.gte = parseFloat(minPrice)
      if (maxPrice) where.basePrice.lte = parseFloat(maxPrice)
    }
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const orderBy = {
      newest: { createdAt: 'desc' },
      price_asc: { basePrice: 'asc' },
      price_desc: { basePrice: 'desc' },
    }[sort] || { createdAt: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip, take: parseInt(limit), include: { category: true } }),
      prisma.product.count({ where })
    ])

    res.json({
      data: products,
      meta: { total, pages: Math.ceil(total / limit), current_page: parseInt(page) }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET SINGLE PRODUCT
router.get('/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        reviews: { where: { isApproved: true }, take: 10 }
      }
    })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// CREATE PRODUCT (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body })
    res.status(201).json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// UPDATE PRODUCT (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body
    })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE PRODUCT (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    res.json({ message: 'Product deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router