// Normalises Kenyan mobile numbers to the 2547XXXXXXXX / 2541XXXXXXXX format
// that Daraja expects. Returns null when the number isn't a valid Kenyan mobile.
function normalizeKenyanPhone(input) {
  let digits = String(input ?? '').replace(/\D/g, '')
  if (digits.startsWith('254')) {
    // already international
  } else if (digits.startsWith('0')) {
    digits = '254' + digits.slice(1)
  } else if (digits.length === 9) {
    digits = '254' + digits
  }
  return /^254[17]\d{8}$/.test(digits) ? digits : null
}

module.exports = { normalizeKenyanPhone }
