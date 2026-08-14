import { compareYmd, parseYmd, todayInBarbados } from '../barbadosDate'
import type { Ymd } from '../barbadosDate'
import type { DateParts } from './types'

// Current calendar date in Barbados, used as the default age comparison date.
export function barbadosToday(): Ymd {
  return todayInBarbados()
}

// Whether a date of birth makes the person under 18 on the given comparison
// date. Returns null when the date of birth is not a real calendar date.
// Kept pure and independent of the clock so it can be tested with an explicit
// comparison date.
export function isUnder18(dob: DateParts, comparison: Ymd): boolean | null {
  const parsed = parseYmd(dob)
  if (!parsed) return null
  const eighteenthBirthday: Ymd = {
    year: parsed.year + 18,
    month: parsed.month,
    day: parsed.day,
  }
  return compareYmd(comparison, eighteenthBirthday) < 0
}
