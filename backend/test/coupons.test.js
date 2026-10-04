const test = require('node:test')
const assert = require('node:assert/strict')
const { evaluateCoupon } = require('../src/utils/coupons')

const basePromo = {
  isActive: true, type: 'PERCENTAGE', value: 10, minimumOrder: 0,
  appliesToAll: true, productIds: [], categoryIds: [],
  usageLimit: null, usageCount: 0, startDate: null, endDate: null,
}
const cart = [
  { productId: 'p1', categoryId: 'c1', subtotal: 1000 },
  { productId: 'p2', categoryId: 'c2', subtotal: 500 },
]

test('percentage coupon applies to the whole cart when appliesToAll', () => {
  const r = evaluateCoupon(basePromo, cart)
  assert.equal(r.ok, true)
  assert.equal(r.discount, 150)
})

test('product-specific coupon discounts only the matching items', () => {
  const r = evaluateCoupon({ ...basePromo, appliesToAll: false, productIds: ['p1'] }, cart)
  assert.equal(r.ok, true)
  assert.equal(r.discount, 100) // 10% of 1000, not of 1500
})

test('category-specific coupon discounts only items in that category', () => {
  const r = evaluateCoupon({ ...basePromo, appliesToAll: false, categoryIds: ['c2'] }, cart)
  assert.equal(r.ok, true)
  assert.equal(r.discount, 50)
})

test('coupon that matches nothing in the cart is rejected', () => {
  const r = evaluateCoupon({ ...basePromo, appliesToAll: false, productIds: ['other'] }, cart)
  assert.equal(r.ok, false)
  assert.match(r.error, /does not apply/)
})

test('fixed coupon never exceeds the eligible items', () => {
  const r = evaluateCoupon({ ...basePromo, type: 'FIXED', value: 5000, appliesToAll: false, productIds: ['p2'] }, cart)
  assert.equal(r.discount, 500)
})

test('minimum order is checked against the whole cart', () => {
  const r = evaluateCoupon({ ...basePromo, minimumOrder: 2000 }, cart)
  assert.equal(r.ok, false)
  assert.match(r.error, /Minimum order/)
})

test('usage limit, expiry, start date and inactive coupons are rejected', () => {
  const now = new Date('2026-10-03T12:00:00Z')
  assert.equal(evaluateCoupon({ ...basePromo, usageLimit: 5, usageCount: 5 }, cart, now).ok, false)
  assert.equal(evaluateCoupon({ ...basePromo, endDate: '2026-10-01T00:00:00Z' }, cart, now).ok, false)
  assert.equal(evaluateCoupon({ ...basePromo, startDate: '2026-11-01T00:00:00Z' }, cart, now).ok, false)
  assert.equal(evaluateCoupon({ ...basePromo, isActive: false }, cart, now).ok, false)
  assert.equal(evaluateCoupon(null, cart, now).ok, false)
})

test('Prisma Decimal-like values (strings) are handled', () => {
  const r = evaluateCoupon({ ...basePromo, value: '10', minimumOrder: '0' }, [{ productId: 'p1', subtotal: '1000' }])
  assert.equal(r.discount, 100)
})
