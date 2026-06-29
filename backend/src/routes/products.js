const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// GET ALL PRODUCTS (public)
router.get('/', async (req, res) => {
  try {
    const { search, sort, milestone, limit = 20, page = 1 } = req.query
    const where = { status: 'active' }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (milestone) {
      where.milestoneTags = { has: milestone }
    }

    let orderBy = { createdAt: 'desc' }
    if (sort === 'price_asc') orderBy = { basePrice: 'asc' }
    if (sort === 'price_desc') orderBy = { basePrice: 'desc' }

    const take = parseInt(limit)
    const skip = (parseInt(page) - 1) * take

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, take, skip }),
      prisma.product.count({ where })
    ])

    res.json({
      data: products,
      meta: {
        total,
        pages: Math.ceil(total / take),
        current_page: parseInt(page)
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET SINGLE PRODUCT (public)
router.get('/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: req.params.slug },
          { id: req.params.slug }
        ]
      }
    })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// CREATE PRODUCT (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body })
    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// UPDATE PRODUCT (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const {
      id, categoryId, createdAt, updatedAt, category,
      ...updateData
    } = req.body

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData
    })
    res.json(product)
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE PRODUCT (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    res.json({ message: 'Product deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router