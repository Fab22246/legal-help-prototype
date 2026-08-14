// Route paths for the will service, centralised so pages reference destinations
// without repeating string literals.

export const WILL_BASE = '/make-a-will'

export const willPaths = {
  start: WILL_BASE,
  suitabilityIntro: `${WILL_BASE}/check-suitability`,
  // Single journey route; the step id selects the page component.
  stepPattern: `${WILL_BASE}/step/:id`,
  checkYourAnswers: `${WILL_BASE}/check-your-answers`,
  // Single change-router entry: Change links pass their target key and it opens
  // the owning edit view, then returns to Check your answers.
  change: `${WILL_BASE}/change`,
  clearConfirm: `${WILL_BASE}/clear-answers`,
  resultA: `${WILL_BASE}/your-will`,
  signing: `${WILL_BASE}/sign-and-witness`,
  safekeeping: `${WILL_BASE}/safekeeping`,
  resultB: `${WILL_BASE}/will-for-legal-review`,
  resultC: `${WILL_BASE}/information-summary`,
}

export function stepPath(id: string): string {
  return `${WILL_BASE}/step/${id}`
}

// Path relative to WILL_BASE, used to mount the will route subtree under a
// splat parent route.
export function willRoutePath(fullPath: string): string {
  return fullPath === WILL_BASE ? '' : fullPath.slice(WILL_BASE.length + 1)
}

// Existing internal routes reused by the will service.
export const externalPaths = {
  home: '/',
  prepareForLawyer: '/prepare-for-lawyer',
  govBarbados: 'https://www.gov.bb/',
}
