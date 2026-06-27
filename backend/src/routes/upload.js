const express = require('express')
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'minimingle-products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
})

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

router.post('/image', protect, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ url: req.file.path, filename: req.file.filename })
})

router.post('/images', protect, adminOnly, upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' })
  const urls = req.files.map(f => ({ url: f.path, filename: f.filename }))
  res.json({ urls })
})

module.exports = router