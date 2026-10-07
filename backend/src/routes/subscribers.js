const express = require('express')
const prisma = require('../prismaClient')
const { protect, adminOnly } = require('../middleware/auth')
const { normalizeEmail, csvCell } = require('../utils/subscribers')

const router = express.Router()

// ---------- PUBLIC ----------

// Join the newsletter (footer form). The reply is the same whether the address is
// new or already on the list, so the form can't be used to check who is subscribed.
router.post('/', async (req, res) => {
  try {
    // Hidden "website" field: real people leave it empty, simple bots fill it in.
    if (req.body.website) return res.status(201).json({ message: 'Thanks for subscribing!' })

    const email = normalizeEmail(req.body.email)
    if (!email) return res.status(400).json({ error: 'Please enter a valid email address' })

    const existing = await prisma.subscriber.findUnique({ where: { email } })
    if (!existing) {
      await prisma.subscriber.create({ data: { email, source: String(req.body.source || 'footer').slice(0, 40) } })
    } else if (!existing.isActive) {
      // They typed their address in again, so treat it as re-joining.
      await prisma.subscriber.update({ where: { id: existing.id }, data: { isActive: true, unsubscribedAt: null } })
    }
    res.status(201).json({ message: 'Thanks for subscribing!' })
  } catch (err) {
    console.error('Subscribe error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// One-click unsubscribe link for emails: /api/subscribers/unsubscribe/<token>
router.get('/unsubscribe/:token', async (req, res) => {
  const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;max-width:420px;margin:15vh auto;padding:0 20px;text-align:center;color:#1f2937"><h2 style="color:#db2777">MiniMingle</h2><p>${body}</p></body></html>`
  try {
    const result = await prisma.subscriber.updateMany({
      where: { unsubscribeToken: req.params.token },
      data: { isActive: false, unsubscribedAt: new Date() }
    })
    if (result.count === 0) return res.status(404).send(page('Link not valid', 'This unsubscribe link is not valid.'))
    res.send(page('Unsubscribed', "You've been unsubscribed and won't receive our emails any more."))
  } catch (err) {
    console.error('Unsubscribe error:', err)
    res.status(500).send(page('Error', 'Something went wrong. Please try again later.'))
  }
})

// ---------- ADMIN ----------

function listFilter(query) {
  const where = {}
  if (query.status === 'active') where.isActive = true
  if (query.status === 'unsubscribed') where.isActive = false
  const search = String(query.search || '').trim().toLowerCase()
  if (search) where.email = { contains: search, mode: 'insensitive' }
  return where
}

// List with search, status filter and paging
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100)
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const where = listFilter(req.query)

    const [subscribers, total, all, active] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        orderBy: { subscribedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        select: { id: true, email: true, isActive: true, source: true, subscribedAt: true, unsubscribedAt: true }
      }),
      prisma.subscriber.count({ where }),
      prisma.subscriber.count(),
      prisma.subscriber.count({ where: { isActive: true } })
    ])

    res.json({
      subscribers,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      counts: { all, active, unsubscribed: all - active }
    })
  } catch (err) {
    console.error('List subscribers error:', err)
    res.status(500).json({ error: 'Unable to load subscribers' })
  }
})

// CSV export. Defaults to active subscribers only (the people you may email).
router.get('/export', protect, adminOnly, async (req, res) => {
  try {
    const status = req.query.status === 'all' || req.query.status === 'unsubscribed' ? req.query.status : 'active'
    const rows = await prisma.subscriber.findMany({
      where: listFilter({ status }),
      orderBy: { subscribedAt: 'desc' },
      select: { email: true, isActive: true, source: true, subscribedAt: true }
    })
    const lines = ['email,status,source,subscribed_at']
    for (const r of rows) {
      lines.push([r.email, r.isActive ? 'active' : 'unsubscribed', r.source, r.subscribedAt.toISOString()].map(csvCell).join(','))
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="subscribers-${status}.csv"`)
    res.send(lines.join('\r\n'))
  } catch (err) {
    console.error('Export subscribers error:', err)
    res.status(500).json({ error: 'Unable to export subscribers' })
  }
})

// Activate / deactivate one subscriber
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    if (typeof req.body.isActive !== 'boolean') return res.status(400).json({ error: 'isActive must be true or false' })
    const result = await prisma.subscriber.updateMany({
      where: { id: req.params.id },
      data: { isActive: req.body.isActive, unsubscribedAt: req.body.isActive ? null : new Date() }
    })
    if (result.count === 0) return res.status(404).json({ error: 'Subscriber not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('Update subscriber error:', err)
    res.status(500).json({ error: 'Unable to update subscriber' })
  }
})

// Remove a subscriber completely
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const result = await prisma.subscriber.deleteMany({ where: { id: req.params.id } })
    if (result.count === 0) return res.status(404).json({ error: 'Subscriber not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete subscriber error:', err)
    res.status(500).json({ error: 'Unable to delete subscriber' })
  }
})

module.exports = router
