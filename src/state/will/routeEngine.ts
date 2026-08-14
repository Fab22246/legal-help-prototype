import type {
  IssueCode,
  ReviewPoint,
  RouteId,
  TerminalId,
  WillAnswers,
  WillDerived,
} from './types'

function yesOrNotSure(value: string | undefined): boolean {
  return value === 'yes' || value === 'not-sure'
}

function noOrNotSure(value: string | undefined): boolean {
  return value === 'no' || value === 'not-sure'
}

// True when the person is under 18, or may be, for beneficiary review purposes.
export function personIsUnderOrMaybe(answers: WillAnswers, personId: string | undefined): boolean {
  if (!personId) return false
  if (answers.minorChildIds.includes(personId)) return true
  if (answers.dependantAdultChildIds.includes(personId)) return false
  const person = answers.people.find((record) => record.id === personId)
  if (!person) return false
  return person.under18Answer === 'yes' || person.under18Answer === 'not-sure'
}

function computeTerminal(answers: WillAnswers): TerminalId | undefined {
  if (answers.s1 === 'no') return 'T1'
  if (answers.safeguardingScreen) return 'T2'
  if (answers.s3 === 'no' || answers.s3 === 'not-sure') return 'T3'
  if (answers.s4 === 'no' && answers.s5 === 'no') return 'T4'
  return undefined
}

export function computeIssues(answers: WillAnswers): IssueCode[] {
  const issues: IssueCode[] = []
  if (answers.s7 === 'yes') issues.push('JOINT_WILL')
  if (answers.a5 === 'not-sure') issues.push('EXISTING_WILL_UNCERTAIN')
  if (answers.a5 === 'yes' && noOrNotSure(answers.a6)) issues.push('EXISTING_WILL_NOT_REPLACED')
  if (yesOrNotSure(answers.p4)) issues.push('BUSINESS_SUCCESSION')
  if (answers.p5 === 'yes') issues.push('OWNERSHIP_DISPUTE')
  if (yesOrNotSure(answers.p6)) issues.push('LIFETIME_INTEREST')
  if (yesOrNotSure(answers.p7)) issues.push('CONDITIONAL_GIFT')
  if (yesOrNotSure(answers.p8)) issues.push('POSSIBLE_INSOLVENCY')
  return issues
}

function familyOrDependantIds(answers: WillAnswers): string[] {
  const ids: string[] = []
  if (answers.spousePersonId) ids.push(answers.spousePersonId)
  if (answers.partnerPersonId) ids.push(answers.partnerPersonId)
  ids.push(...answers.minorChildIds)
  ids.push(...answers.dependantAdultChildIds)
  ids.push(...answers.otherDependantIds)
  return ids
}

// People who receive a primary specific gift or primary remainder share.
function primaryBeneficiaryIds(answers: WillAnswers): Set<string> {
  const ids = new Set<string>()
  for (const gift of answers.gifts) {
    if (gift.recipientType === 'person' && gift.recipientPersonId) ids.add(gift.recipientPersonId)
  }
  for (const beneficiary of answers.remainder) {
    if (beneficiary.recipientType === 'person' && beneficiary.recipientPersonId) {
      ids.add(beneficiary.recipientPersonId)
    }
  }
  return ids
}

export function computeReviewPoints(answers: WillAnswers): ReviewPoint[] {
  const points = new Set<ReviewPoint>()

  if (yesOrNotSure(answers.s6)) points.add('FOREIGN_ASSETS')
  if (noOrNotSure(answers.a3)) points.add('MAIN_HOME_OUTSIDE_BARBADOS')
  if (yesOrNotSure(answers.a4)) points.add('OTHER_CITIZENSHIP')
  if (answers.a7 === 'yes') points.add('CURRENT_MARRIAGE')
  if (answers.a7 === 'yes' && answers.a9 === 'yes') points.add('MARRIED_SEPARATED')
  if (answers.a11 === 'yes') points.add('UNMARRIED_PARTNER')
  if (yesOrNotSure(answers.a13)) points.add('PLANNED_MARRIAGE')
  if (answers.f1 === 'yes') points.add('MINOR_CHILD')
  if (answers.f3 === 'yes') points.add('DEPENDANT_ADULT_CHILD')
  if (answers.f5 === 'yes') points.add('OTHER_DEPENDANT')
  if (yesOrNotSure(answers.p1)) points.add('JOINTLY_OWNED_ASSET')
  if (answers.p3 === 'yes') points.add('BUSINESS_OWNERSHIP')

  if (answers.gifts.some((gift) => gift.kind === 'land')) points.add('SPECIFIC_GIFT_OF_LAND')

  const minorBeneficiary =
    answers.gifts.some(
      (gift) =>
        personIsUnderOrMaybe(answers, gift.recipientPersonId) ||
        personIsUnderOrMaybe(answers, gift.replacementPersonId),
    ) ||
    answers.remainder.some(
      (beneficiary) =>
        personIsUnderOrMaybe(answers, beneficiary.recipientPersonId) ||
        personIsUnderOrMaybe(answers, beneficiary.replacementPersonId),
    )
  if (minorBeneficiary) points.add('MINOR_BENEFICIARY')

  if (answers.remainder.some((beneficiary) => beneficiary.fallback === 'to-children')) {
    points.add('BENEFICIARY_CHILDREN_FALLBACK')
  }

  const primaries = primaryBeneficiaryIds(answers)
  const excluded = familyOrDependantIds(answers).some((id) => !primaries.has(id))
  if (excluded) points.add('FAMILY_OR_DEPENDANT_NOT_INCLUDED')

  return [...points]
}

// Recompute terminal, route, review points and issues from the current answers.
// Route priority: terminal or safeguarding, then Route C, then Route B, then
// Route A.
export function computeDerived(answers: WillAnswers): WillDerived {
  const terminal = computeTerminal(answers)
  const issues = computeIssues(answers)
  const reviewPoints = computeReviewPoints(answers)

  let route: RouteId = 'A'
  if (issues.length > 0) route = 'C'
  else if (reviewPoints.length > 0) route = 'B'

  return { terminal, route, reviewPoints, issues }
}
