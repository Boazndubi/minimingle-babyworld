const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' }
    })
    res.json(categories)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const category = await prisma.category.create({ data: req.body })
    res.status(201).json(category)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body
    })
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } })
    res.json({ message: 'Category deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router