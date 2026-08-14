import type { Address, DateParts, Name, PersonRecord, WillAnswers } from './types'

// Build a full name from non-empty parts in order, single-spaced.
export function fullName(name: Name | undefined): string {
  if (!name) return ''
  return [name.firstName, name.middleNames, name.lastName]
    .map((part) => (part ?? '').trim())
    .filter((part) => part.length > 0)
    .join(' ')
}

// Build a single-line address from non-empty fields in display order.
export function addressLine(address: Address | undefined): string {
  if (!address) return ''
  return [address.line1, address.line2, address.townOrCity, address.parish, address.country]
    .map((part) => (part ?? '').trim())
    .filter((part) => part.length > 0)
    .join(', ')
}

// Labelled address rows for summary display.
export function addressRows(address: Address | undefined): { label: string; value: string }[] {
  if (!address) return []
  const rows: { label: string; value: string }[] = []
  const push = (label: string, value?: string) => {
    const trimmed = (value ?? '').trim()
    if (trimmed.length > 0) rows.push({ label, value: trimmed })
  }
  push('Address line 1', address.line1)
  push('Address line 2', address.line2)
  push('Town or city', address.townOrCity)
  push('Parish', address.parish)
  push('Country', address.country)
  return rows
}

const MONTHS = [
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

// Format day/month/year parts as "14 August 2026". Returns '' when incomplete
// or not a real calendar date.
export function formatDateParts(date: DateParts | undefined): string {
  if (!date) return ''
  const day = Number(date.day)
  const month = Number(date.month)
  const year = Number(date.year)
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return ''
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1) return ''
  const check = new Date(Date.UTC(year, month - 1, day))
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return ''
  }
  return `${day} ${MONTHS[month - 1]} ${year}`
}

// Date the output was created, formatted in Barbados time as "14 August 2026".
export function formatCreatedDate(now: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Barbados',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)
}

// Display "Yes", "No" or "Not sure" for a stored answer value.
export function displayYesNo(value: string | undefined): string {
  if (value === 'yes') return 'Yes'
  if (value === 'no') return 'No'
  if (value === 'not-sure') return 'Not sure'
  return ''
}

export function findPerson(answers: WillAnswers, id: string | undefined): PersonRecord | undefined {
  if (!id) return undefined
  return answers.people.find((person) => person.id === id)
}

export function findOrganisationName(answers: WillAnswers, id: string | undefined): string {
  if (!id) return ''
  const org = answers.organisations.find((organisation) => organisation.id === id)
  return org ? org.legalName.trim() : ''
}

// Relationship label to show for a person, honouring the role-derived labels for
// the spouse (A8) and partner (A12) records.
export function relationshipLabel(answers: WillAnswers, person: PersonRecord): string {
  if (answers.spousePersonId === person.id) return 'Husband or wife'
  if (answers.partnerPersonId === person.id) return 'Partner'
  return (person.relationship ?? '').trim()
}
