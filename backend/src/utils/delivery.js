const prisma = require('../prismaClient')

async function getDeliveryFee(city) {
  const key = String(city || '').trim().toLowerCase()
  const zone = await prisma.deliveryZone.findUnique({ where: { city: key } })
  if (zone) return Number(zone.fee)
  const fallback = await prisma.deliveryZone.findUnique({ where: { city: 'default' } })
  return fallback ? Number(fallback.fee) : 500
}

module.exports = { getDeliveryFee }