// Timezone-aware "today" for the tenancy builder. The tenancy start date must
// be validated against the current date in Barbados (`America/Barbados`), not
// the browser's local timezone. Uses `Intl.DateTimeFormat` for the timezone
// projection — no dependency needed.

export interface Ymd {
  year: number
  month: number // 1..12
  day: number // 1..31
}

const BARBADOS_TZ = 'America/Barbados'

/** Current calendar date in Barbados as { year, month, day }. */
export function todayInBarbados(now: Date = new Date()): Ymd {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BARBADOS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return { year, month, day }
}

function parseIntSafe(s: string): number | null {
  if (!/^\d+$/.test(s)) return null
  const n = parseInt(s, 10)
  return Number.isNaN(n) ? null : n
}

/**
 * Parse day/month/year input into a real calendar date. Returns null for
 * missing parts, non-numeric parts, out-of-range years, or dates that do not
 * exist in the Gregorian calendar (e.g. 31 February — which would roll into
 * March if constructed).
 */
export function parseYmd(fields: { day: string; month: string; year: string }): Ymd | null {
  const d = parseIntSafe(fields.day)
  const m = parseIntSafe(fields.month)
  const y = parseIntSafe(fields.year)
  if (d === null || m === null || y === null) return null
  if (y < 1000 || y > 9999) return null
  if (m < 1 || m > 12) return null
  if (d < 1 || d > 31) return null
  // Round-trip through UTC (timezone-independent) to reject e.g. 31 Feb.
  const utc = new Date(Date.UTC(y, m - 1, d))
  if (utc.getUTCFullYear() !== y || utc.getUTCMonth() !== m - 1 || utc.getUTCDate() !== d) return null
  return { year: y, month: m, day: d }
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Ordinal suffix for a day of the month (1st, 2nd, 3rd, 4th, 11th, 21st, …). */
function ordinalSuffix(day: number): string {
  const withinCentury = day % 100
  if (withinCentury >= 11 && withinCentury <= 13) return 'th'
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

/**
 * Format day/month/year input for display following the GovTech Barbados
 * content standard, for example "August 31st, 2027". Returns null when the
 * input is not a real date, so callers can decide what to show instead of
 * exposing partial or invalid values.
 */
export function formatBarbadosDate(fields: { day: string; month: string; year: string }): string | null {
  const ymd = parseYmd(fields)
  if (!ymd) return null
  return `${MONTH_NAMES[ymd.month - 1]} ${ymd.day}${ordinalSuffix(ymd.day)}, ${ymd.year}`
}

/** Compare two Ymd values. Returns negative / zero / positive like `<=>`. */
export function compareYmd(a: Ymd, b: Ymd): number {
  if (a.year !== b.year) return a.year - b.year
  if (a.month !== b.month) return a.month - b.month
  return a.day - b.day
}
