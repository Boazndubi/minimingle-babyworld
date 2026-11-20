const { randomBytes } = require('node:crypto')

function createPesapalMerchantReference(orderNumber) {
  return `${orderNumber}-r${Date.now()}-${randomBytes(4).toString('hex')}`
}

function matchesPesapalMerchantReference(reference, orderNumber) {
  if (reference === orderNumber) return true
  if (typeof reference !== 'string' || !reference.startsWith(`${orderNumber}-r`)) return false
  return /^-r\d+-[a-f0-9]{8}$/i.test(reference.slice(orderNumber.length))
}

module.exports = { createPesapalMerchantReference, matchesPesapalMerchantReference }
