const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeEmail, csvCell } = require('../src/utils/subscribers')

test('normalizeEmail trims and lower-cases valid addresses', () => {
  assert.equal(normalizeEmail('  Mama@Example.COM '), 'mama@example.com')
})

test('normalizeEmail rejects invalid input', () => {
  for (const bad of ['', null, undefined, 'abc', 'a@b', 'a b@c.com', '@x.com', 'x@.com', 'a'.repeat(250) + '@x.com']) {
    assert.equal(normalizeEmail(bad), null, String(bad))
  }
})

test('csvCell quotes values containing commas, quotes or newlines', () => {
  assert.equal(csvCell('a,b'), '"a,b"')
  assert.equal(csvCell('say "hi"'), '"say ""hi"""')
  assert.equal(csvCell('plain'), 'plain')
})

test('csvCell neutralises spreadsheet formulas', () => {
  assert.equal(csvCell('=cmd@x.com'), "'=cmd@x.com")
  assert.equal(csvCell('+1@x.com'), "'+1@x.com")
  assert.equal(csvCell('-1@x.com'), "'-1@x.com")
})
