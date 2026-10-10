const prisma = require('../prismaClient')

// Releases everything an unpaid order was holding: reserved stock and the
// coupon use. Call it inside the transaction that cancels the order, and only
// once per order.
async function releaseOrderHolds(tx, order) {
  for (const item of order.items) {
    if (item.variantId) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { quantity: { increment: item.quantity } }
      })
    } else {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } }
      })
    }
  }
  if (order.couponCode) {
    await tx.promotion.updateMany({
      where: { couponCode: order.couponCode, usageCount: { gt: 0 } },
      data: { usageCount: { decrement: 1 } }
    })
  }
}

// Moves a still-pending order to a terminal unpaid state ('failed' or 'expired')
// and releases its stock and coupon. The guarded updateMany makes this safe when
// a payment callback and the expiry job (or two callbacks) race: only one of
// them wins, so stock and coupons are never released twice.
// Returns the order as it stands afterwards (or null if it doesn't exist).
async function cancelPendingOrder(orderId, paymentStatus) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: 'pending' },
      data: { paymentStatus, status: 'cancelled' }
    })
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } })
    if (order && claimed.count === 1) await releaseOrderHolds(tx, order)
    return order
  })
}

const markPaymentFailed = (orderId) => cancelPendingOrder(orderId, 'failed')

module.exports = { cancelPendingOrder, markPaymentFailed, releaseOrderHolds }
