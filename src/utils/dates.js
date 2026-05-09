import { differenceInCalendarDays, format } from 'date-fns'
import { pl } from 'date-fns/locale'

/**
 * Format a date or date range into a human\-readable Polish string.
 *
 * Accepts:
 * - Date object
 * - ISO date string (e.g. "2025-12-01")
 * - Comma\-separated string with start and optional end (e.g. "2025-12-01,2025-12-05")
 * - Array of two Date objects or date strings
 *
 * Behavior:
 * - Returns single date formatted as "D MMMM" (locale `pl`) when only a start date is present.
 * - Returns range formatted as "D MMMM - D MMMM (Ndni)" where `N` is the number of days between end and start.
 * - Returns an empty string for invalid or missing dates.
 *
 * Examples:
 * - `formatDateRange("2025-12-01")` -> "1 grudnia"
 * - `formatDateRange(["2025-12-01","2025-12-05"])` -> "1 grudnia - 5 grudnia (4dni)"
 *
 * Note: Uses `date-fns` for formatting and `pl` locale.
 */

export function formatDateRange (input, locale = pl) {
  let startDate, endDate

  if (Array.isArray(input)) {
    [startDate, endDate] = input.map(d => typeof d === 'string' ? new Date(d) : d)
  } else if (typeof input === 'string' && input.includes(',')) {
    const [startStr, endStr] = input.split(',')
    startDate = new Date(startStr)
    endDate = endStr ? new Date(endStr) : null
  } else if (typeof input === 'string') {
    startDate = new Date(input)
    endDate = null
  } else if (input instanceof Date) {
    startDate = input
    endDate = null
  } else {
    return ''
  }

  if (!startDate || isNaN(startDate)) {
    return ''
  }

  const startFormatted = format(startDate, 'd MMMM', { locale })
  if (!endDate || isNaN(endDate)) {
    return startFormatted
  }

  const endFormatted = format(endDate, 'd MMMM', { locale })
  const days = differenceInCalendarDays(endDate, startDate) + 1
  return `${startFormatted} - ${endFormatted} (${days}dni)`
}

export function formatDateRangeSimple (input, locale = pl) {
  let startDate, endDate

  if (Array.isArray(input)) {
    [startDate, endDate] = input.map(d => typeof d === 'string' ? new Date(d) : d)
  } else if (typeof input === 'string' && input.includes(',')) {
    const [startStr, endStr] = input.split(',')
    startDate = new Date(startStr)
    endDate = endStr ? new Date(endStr) : null
  } else if (typeof input === 'string') {
    startDate = new Date(input)
    endDate = null
  } else if (input instanceof Date) {
    startDate = input
    endDate = null
  } else {
    return ''
  }

  if (!startDate || isNaN(startDate)) {
    return ''
  }

  const startFormatted = format(startDate, 'd MMMM', { locale })
  if (!endDate || isNaN(endDate)) {
    return startFormatted
  }

  const endFormatted = format(endDate, 'd MMMM', { locale })
  return `${startFormatted} - ${endFormatted}`
}
