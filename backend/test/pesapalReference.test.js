const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createPesapalMerchantReference,
  matchesPesapalMerchantReference
} = require('../src/utils/pesapalReference')

test('creates unique Pesapal references tied to the internal order number', () => {
  const reference = createPesapalMerchantReference('MMBW-1234567890')
  assert.match(reference, /^MMBW-1234567890-r\d+-[a-f0-9]{8}$/)
  assert.equal(matchesPesapalMerchantReference(reference, 'MMBW-1234567890'), true)
})

test('accepts legacy references and rejects unrelated or malformed references', () => {
  assert.equal(matchesPesapalMerchantReference('MMBW-1234567890', 'MMBW-1234567890'), true)
  assert.equal(matchesPesapalMerchantReference('MMBW-999-r123-aabbccdd', 'MMBW-1234567890'), false)
  assert.equal(matchesPesapalMerchantReference('MMBW-1234567890-rbad-aabbccdd', 'MMBW-1234567890'), false)
})
