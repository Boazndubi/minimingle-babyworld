const express = require('express')
const prisma = require('../prismaClient')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.get('/', protect, async (req, res) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: { product: true }
    })
    res.json(wishlist)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

router.post('/', protect, async (req, res) => {
  try {
    const item = await prisma.wishlist.create({
      data: { userId: req.user.id, productId: req.body.productId }
    })
    res.status(201).json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

router.delete('/:productId', protect, async (req, res) => {
  try {
    await prisma.wishlist.deleteMany({
      where: { userId: req.user.id, productId: req.params.productId }
    })
    res.json({ message: 'Removed from wishlist' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

module.exports = router