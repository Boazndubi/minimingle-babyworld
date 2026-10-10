const express = require('express')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()
const prisma = require('../prismaClient')

const withAvailableQuantity = (product) => ({
  ...product,
  quantity: product.variants?.length
    ? product.variants.reduce((total, variant) => total + variant.quantity, 0)
    : product.quantity
})

const validVariants = (variants) => {
  if (!Array.isArray(variants)) return false
  const skus = variants.map(variant => String(variant?.sku || '').trim().toLowerCase())
  const combinations = variants.map(variant =>
    `${String(variant?.color || '').trim().toLowerCase()}|${String(variant?.size || '').trim().toLowerCase()}`
  )
  return variants.every((variant) =>
    variant &&
    typeof variant === 'object' &&
    typeof variant.sku === 'string' &&
    variant.sku.trim() &&
    (String(variant.color || '').trim() || String(variant.size || '').trim()) &&
    Number.isInteger(Number(variant.quantity)) &&
    Number(variant.quantity) >= 0
  ) && new Set(skus).size === skus.length && new Set(combinations).size === combinations.length
}

// GET ALL PRODUCTS (public)
router.get('/', async (req, res) => {
  try {
    const { search, sort, milestone, category, minPrice, maxPrice, inStock, limit = 20, page = 1 } = req.query
    const where = { status: 'active' }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
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
    if (inStock === 'true') {
      where.AND = [
        ...(where.AND || []),
        { OR: [{ quantity: { gt: 0 } }, { variants: { some: { quantity: { gt: 0 } } } }] }
      ]
    }

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
        include: { category: true, variants: { orderBy: [{ color: 'asc' }, { size: 'asc' }] } }
      }),
      prisma.product.count({ where })
    ])

    res.json({
      data: products.map(withAvailableQuantity),
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
      include: { category: true, variants: { orderBy: [{ color: 'asc' }, { size: 'asc' }] } }
    })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(withAvailableQuantity(product))
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
      variants = [],
      ...rest
    } = req.body

    if (!validVariants(variants)) return res.status(400).json({ error: 'Each variant needs a unique SKU and color/size combination, a color or size, and a non-negative stock quantity' })
    const product = await prisma.product.create({
      data: {
        ...rest,
        quantity: variants.length ? 0 : Number(rest.quantity || 0),
        categoryId: categoryId || null,
        variants: { create: variants.map(({ id: _id, ...variant }) => variant) }
      },
      include: { category: true, variants: true }
    })
    res.status(201).json(withAvailableQuantity(product))
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Product or variant SKU/slug is already in use' })
    res.status(500).json({ error: error.message })
  }
})

// UPDATE PRODUCT (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const {
      id, createdAt, updatedAt, category,
      categoryId,
      quantity,
      variants,
      ...updateData
    } = req.body

    if (variants !== undefined && !validVariants(variants)) {
      return res.status(400).json({ error: 'Each variant needs a unique SKU and color/size combination, a color or size, and a non-negative stock quantity' })
    }

    const product = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({
        where: { id: req.params.id },
        include: { variants: true }
      })
      if (!existing) return null

      if (variants !== undefined) {
        const incomingIds = new Set(variants.filter(variant => variant.id).map(variant => variant.id))
        const removed = existing.variants.filter(variant => !incomingIds.has(variant.id))
        for (const variant of removed) {
          const orderItemCount = await tx.orderItem.count({ where: { variantId: variant.id } })
          if (orderItemCount > 0) {
            throw Object.assign(new Error(`Variant ${variant.sku} is used by existing orders and cannot be removed`), { statusCode: 409 })
          }
          await tx.productVariant.delete({ where: { id: variant.id } })
        }

        for (const { id: variantId, ...variant } of variants) {
          if (variantId) {
            const ownedVariant = existing.variants.find(existingVariant => existingVariant.id === variantId)
            if (!ownedVariant) {
              throw Object.assign(new Error('Variant does not belong to this product'), { statusCode: 400 })
            }
            await tx.productVariant.update({ where: { id: variantId }, data: variant })
          } else {
            await tx.productVariant.create({ data: { ...variant, productId: existing.id } })
          }
        }
      }

      return tx.product.update({
        where: { id: req.params.id },
        data: {
          ...updateData,
          ...(variants !== undefined
            ? { quantity: variants.length ? 0 : Number(quantity || 0) }
            : quantity !== undefined ? { quantity: Number(quantity) } : {}),
          categoryId: categoryId || null
        },
        include: { category: true, variants: true }
      })
    })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(withAvailableQuantity(product))
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message })
    if (error.code === 'P2002') return res.status(409).json({ error: 'Product or variant SKU/slug is already in use' })
    if (error.code === 'P2003') return res.status(409).json({ error: 'This variant is already used by an order and cannot be removed' })
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