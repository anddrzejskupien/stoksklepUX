/**
 * Formats a number as a price without currency symbol
 * @param {number} amount - The amount to format
 * @returns {string} Formatted price string without currency
 */
export function formatPrice (amount) {
  // Handle undefined, null, or non-numeric values
  const numericAmount = Number(amount) || 0

  return numericAmount.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Generates a unique 8-character ID using timestamp and random characters
 * @returns {string} 8-character unique identifier
 */
export function generateUniqueId () {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2)
  const combined = timestamp + random
  return combined.slice(0, 8).toUpperCase()
}
