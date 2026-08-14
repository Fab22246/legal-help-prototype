import { compareYmd, parseYmd, todayInBarbados } from '../barbadosDate'
import { isUnder18 } from './age'
import { formatPercentage } from './checkYourAnswers'
import type { DateParts } from './types'

// Names: at least one Unicode letter; only letters, spaces, apostrophes,
// hyphens and full stops.
const NAME_ALLOWED = /^[\p{L} '.-]+$/u
const HAS_LETTER = /\p{L}/u

export function isValidName(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && HAS_LETTER.test(trimmed) && NAME_ALLOWED.test(trimmed)
}

// Error for a required name field: missing message, or the invalid-name message.
export function nameError(value: string, missingMessage: string): string | undefined {
  if (value.trim().length === 0) return missingMessage
  if (!isValidName(value)) return 'Enter a name using letters.'
  return undefined
}

// Optional name field (middle names): only validated when provided.
export function optionalNameError(value: string): string | undefined {
  if (value.trim().length === 0) return undefined
  if (!isValidName(value)) return 'Enter a name using letters.'
  return undefined
}

export function requiredTextError(value: string, missingMessage: string): string | undefined {
  return value.trim().length === 0 ? missingMessage : undefined
}

export interface DobOptions {
  // Message to use when the date must make the person under 18 but does not.
  underMessage?: string
}

export function dobError(dob: DateParts, options: DobOptions = {}): string | undefined {
  const anyEntered = dob.day.trim() || dob.month.trim() || dob.year.trim()
  if (!anyEntered) return 'Enter date of birth.'
  const parsed = parseYmd(dob)
  if (!parsed) return 'Enter a valid date of birth.'
  if (compareYmd(parsed, todayInBarbados()) > 0) return 'Enter a valid date of birth.'
  if (options.underMessage && !isUnder18(dob, todayInBarbados())) return options.underMessage
  return undefined
}

export function moneyAmountError(amount: string): string | undefined {
  const trimmed = amount.trim()
  if (!/^\d+(\.\d+)?$/.test(trimmed) || Number(trimmed) <= 0) return 'Enter an amount greater than 0.'
  return undefined
}

export function currencyError(currency: string): string | undefined {
  return currency.trim().length === 0 ? 'Enter the currency for this gift.' : undefined
}

export function percentageError(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return 'Enter the percentage for this recipient.'
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return 'Enter a percentage using numbers.'
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return 'Enter a percentage with no more than 2 decimal places.'
  const num = Number(trimmed)
  if (num <= 0 || num > 100) return 'Enter a percentage greater than 0 and no more than 100.'
  return undefined
}

export function percentageTotalError(totalHundredths: number): string {
  return `The percentages must add up to 100%. They currently add up to ${formatPercentage(totalHundredths)}%.`
}

// "Select an answer to: [question without a trailing question mark]."
export function requiredRadioError(questionText: string): string {
  return `Select an answer to: ${questionText.replace(/\?\s*$/, '')}.`
}

// "Enter an answer to: [question without a trailing question mark]."
export function requiredAnswerError(questionText: string): string {
  return `Enter an answer to: ${questionText.replace(/\?\s*$/, '')}.`
}

export const orgNameMissingError = 'Enter the full legal name of the organisation.'
export const invalidRemainderFallbackError =
  'Select what should happen to this share if the recipient cannot receive it.'
