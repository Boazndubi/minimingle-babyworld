const prisma = require('../prismaClient')

async function expirePendingOrders() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000)
  const orders = await prisma.order.findMany({
    where: { paymentStatus: 'pending', status: { not: 'cancelled' }, createdAt: { lt: cutoff } },
    include: { items: true },
    take: 100,
  })

  for (const order of orders) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: 'pending' },
        data: { paymentStatus: 'expired', status: 'cancelled' },
      })
      if (updated.count !== 1) return
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        })
      }
    })
  }

  return orders.length
}

module.exports = { expirePendingOrders }
