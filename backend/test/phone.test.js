const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeKenyanPhone } = require('../src/utils/phone')

test('accepts common Kenyan formats', () => {
  for (const input of ['0712345678', '+254712345678', '254712345678', '712345678', '0712 345 678', '07-12345678']) {
    assert.equal(normalizeKenyanPhone(input), '254712345678', input)
  }
})

test('accepts Safaricom 01xx numbers', () => {
  assert.equal(normalizeKenyanPhone('0112345678'), '254112345678')
})

test('rejects invalid numbers', () => {
  for (const input of ['', null, undefined, '12345', '0612345678', '+1 415 555 2671', '07123456789', 'abc']) {
    assert.equal(normalizeKenyanPhone(input), null, String(input))
  }
})
