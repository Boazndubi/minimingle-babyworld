// Small pure helpers for the newsletter feature (unit tested).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Returns the cleaned, lower-cased email, or null if it isn't a plausible address.
function normalizeEmail(input) {
  const email = String(input ?? '').trim().toLowerCase()
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null
  return email
}

// One CSV cell. Quotes values that need it, and neutralises spreadsheet formulas
// (cells starting with = + - @) so an exported list can't run code in Excel.
function csvCell(value) {
  let text = String(value ?? '')
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

module.exports = { normalizeEmail, csvCell }
