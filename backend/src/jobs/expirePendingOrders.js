const prisma = require('../prismaClient')
const { cancelPendingOrder } = require('../utils/orderPayments')

async function expirePendingOrders() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000)
  const orders = await prisma.order.findMany({
    where: { paymentStatus: 'pending', status: { not: 'cancelled' }, createdAt: { lt: cutoff } },
    select: { id: true },
    take: 100,
  })

  // Releases stock and the coupon use, once per order, even if a payment
  // callback lands at the same moment.
  for (const order of orders) {
    await cancelPendingOrder(order.id, 'expired')
  }

  return orders.length
}

module.exports = { expirePendingOrders }
