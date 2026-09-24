const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../prismaClient')
const { protect } = require('../middleware/auth')

const router = express.Router()
const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
}

const publicUser = (user) => ({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role })
const serializeCookie = (name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`)
  if (options.httpOnly) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')
  if (options.sameSite) parts.push(`SameSite=${options.sameSite[0].toUpperCase()}${options.sameSite.slice(1)}`)
  if (options.path) parts.push(`Path=${options.path}`)
  return parts.join('; ')
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' })
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName, phone }
    })
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.setHeader('Set-Cookie', serializeCookie('access_token', token, cookieOptions))
    res.status(201).json({ user: publicUser(user) })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Unable to register. Please try again.' })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.setHeader('Set-Cookie', serializeCookie('access_token', token, cookieOptions))
    res.json({ user: publicUser(user) })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Unable to log in. Please try again.' })
  }
})

// GET PROFILE
router.get('/me', protect, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { babyProfiles: true }
    })
    res.json(user)
  } catch (err) {
    res.status(401).json({ error: 'Not authorized' })
  }
})

// UPDATE PROFILE
router.put('/me', protect, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName: String(firstName || '').trim(),
        lastName: String(lastName || '').trim(),
        phone: phone ? String(phone).trim() : null,
      },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true }
    })
    res.json(user)
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ error: 'Unable to update profile' })
  }
})

router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', serializeCookie('access_token', '', { ...cookieOptions, maxAge: 0 }))
  res.json({ message: 'Logged out' })
})

router.get('/addresses', protect, async (req, res) => {
  const addresses = await prisma.address.findMany({ where: { userId: req.user.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] })
  res.json(addresses)
})

router.post('/addresses', protect, async (req, res) => {
  try {
    const { label, name, phone, addressLine, city, isDefault } = req.body
    if (!label?.trim() || !name?.trim() || !phone?.trim() || !addressLine?.trim() || !city?.trim()) {
      return res.status(400).json({ error: 'All address fields are required' })
    }
    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) await tx.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } })
      return tx.address.create({ data: { userId: req.user.id, label: label.trim(), name: name.trim(), phone: phone.trim(), addressLine: addressLine.trim(), city: city.trim(), isDefault: Boolean(isDefault) } })
    })
    res.status(201).json(address)
  } catch (err) {
    res.status(500).json({ error: 'Unable to save address' })
  }
})

router.delete('/addresses/:id', protect, async (req, res) => {
  await prisma.address.deleteMany({ where: { id: req.params.id, userId: req.user.id } })
  res.json({ message: 'Address removed' })
})

module.exports = router