const express = require('express')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()
const prisma = require('../prismaClient')

// GET ALL PRODUCTS (public)
router.get('/', async (req, res) => {
  try {
    const { search, sort, milestone, category, minPrice, maxPrice, inStock, limit = 20, page = 1 } = req.query
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

    if (category) {
      where.category = { slug: category }
    }
    if (minPrice || maxPrice) {
      where.basePrice = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      }
    }
    if (inStock === 'true') where.quantity = { gt: 0 }

    let orderBy = { createdAt: 'desc' }
    if (sort === 'price_asc') orderBy = { basePrice: 'asc' }
    if (sort === 'price_desc') orderBy = { basePrice: 'desc' }

    const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100)
    const currentPage = Math.max(parseInt(page, 10) || 1, 1)
    const skip = (currentPage - 1) * take

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take,
        skip,
        include: { category: true }
      }),
      prisma.product.count({ where })
    ])

    res.json({
      data: products,
      meta: {
        total,
        pages: Math.ceil(total / take),
        current_page: currentPage
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
        ],
        status: 'active'
      },
      include: { category: true }
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
    const {
      id, createdAt, updatedAt, category,
      categoryId,
      ...rest
    } = req.body

    const product = await prisma.product.create({
      data: {
        ...rest,
        categoryId: categoryId || null,
      },
      include: { category: true }
    })
    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// UPDATE PRODUCT (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const {
      id, createdAt, updatedAt, category,
      categoryId,
      ...updateData
    } = req.body

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...updateData,
        categoryId: categoryId || null,
      },
      include: { category: true }
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