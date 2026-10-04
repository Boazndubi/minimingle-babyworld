// Pure coupon helpers (no database access) so the rules can be unit tested and
// shared by the checkout "validate" endpoint and order creation.

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

/**
 * Subtotal of the items a promotion actually applies to.
 * items: [{ productId, categoryId?, subtotal }]
 */
function eligibleSubtotal(promo, items) {
  if (promo.appliesToAll) return items.reduce((sum, i) => sum + Number(i.subtotal), 0)
  const productIds = promo.productIds || []
  const categoryIds = promo.categoryIds || []
  return items
    .filter((i) => productIds.includes(i.productId) || (i.categoryId && categoryIds.includes(i.categoryId)))
    .reduce((sum, i) => sum + Number(i.subtotal), 0)
}

/**
 * Checks a promotion against a cart and works out the discount.
 * Returns { ok: true, discount } or { ok: false, status, error }.
 */
function evaluateCoupon(promo, items, now = new Date()) {
  const fail = (error, status = 400) => ({ ok: false, status, error })

  if (!promo || !promo.isActive) return fail('Invalid or expired coupon')
  if (promo.usageLimit !== null && promo.usageLimit !== undefined && promo.usageCount >= promo.usageLimit) {
    return fail('Coupon usage limit reached')
  }
  if (promo.startDate && now < new Date(promo.startDate)) return fail('Coupon not yet active')
  if (promo.endDate && now > new Date(promo.endDate)) return fail('Coupon expired')

  const subtotal = items.reduce((sum, i) => sum + Number(i.subtotal), 0)
  if (subtotal < Number(promo.minimumOrder || 0)) {
    return fail(`Minimum order is KES ${Number(promo.minimumOrder)}`)
  }

  const eligible = eligibleSubtotal(promo, items)
  if (eligible <= 0) return fail('Coupon does not apply to these products')

  const raw = promo.type === 'PERCENTAGE' ? eligible * (Number(promo.value) / 100) : Number(promo.value)
  // Never discount more than the eligible items cost.
  return { ok: true, discount: round2(Math.min(raw, eligible)) }
}

module.exports = { evaluateCoupon, eligibleSubtotal, round2 }
