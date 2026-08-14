import { computeIssues } from './routeEngine'
import type { IssueCode, WillAnswers } from './types'

// All person ids currently referenced by any role, relationship, gift,
// remainder, guardian or Route C include.
export function referencedPersonIds(answers: WillAnswers): Set<string> {
  const ids = new Set<string>()
  const add = (id: string | undefined) => {
    if (id) ids.add(id)
  }
  add(answers.spousePersonId)
  add(answers.partnerPersonId)
  answers.minorChildIds.forEach(add)
  answers.dependantAdultChildIds.forEach(add)
  answers.otherDependantIds.forEach(add)
  answers.executorIds.forEach(add)
  answers.replacementExecutorIds.forEach(add)
  answers.guardianIds.forEach(add)
  answers.replacementGuardianIds.forEach(add)
  answers.gifts.forEach((gift) => {
    add(gift.recipientPersonId)
    add(gift.replacementPersonId)
  })
  answers.remainder.forEach((beneficiary) => {
    add(beneficiary.recipientPersonId)
    add(beneficiary.replacementPersonId)
  })
  answers.cIncludes.forEach((include) => add(include.personId))
  return ids
}

export function referencedOrganisationIds(answers: WillAnswers): Set<string> {
  const ids = new Set<string>()
  const add = (id: string | undefined) => {
    if (id) ids.add(id)
  }
  answers.gifts.forEach((gift) => {
    add(gift.recipientOrgId)
    add(gift.replacementOrgId)
  })
  answers.remainder.forEach((beneficiary) => {
    add(beneficiary.recipientOrgId)
    add(beneficiary.replacementOrgId)
  })
  answers.cIncludes.forEach((include) => add(include.orgId))
  return ids
}

export function isPersonReferenced(answers: WillAnswers, id: string): boolean {
  return referencedPersonIds(answers).has(id)
}

export function isOrganisationReferenced(answers: WillAnswers, id: string): boolean {
  return referencedOrganisationIds(answers).has(id)
}

// Remove shared person and organisation records no role or answer references.
function pruneUnreferenced(answers: WillAnswers): void {
  const people = referencedPersonIds(answers)
  const orgs = referencedOrganisationIds(answers)
  answers.people = answers.people.filter((person) => people.has(person.id))
  answers.organisations = answers.organisations.filter((org) => orgs.has(org.id))
}

// A11 is shown when A7 is No, or when A7 and A9 are both Yes.
function partnerQuestionVisible(answers: WillAnswers): boolean {
  if (answers.a7 === 'no') return true
  if (answers.a7 === 'yes' && answers.a9 === 'yes') return true
  return false
}

// Enforce every conditional-field dependency so hidden answers, and the review
// points and issues derived only from them, do not persist. Mutates a copy.
export function normalizeAnswers(input: WillAnswers): WillAnswers {
  const answers: WillAnswers = { ...input }

  // Suitability
  if (answers.s4 !== 'no') answers.s5 = undefined

  // About you
  if (answers.a4 !== 'yes') answers.a4Countries = []
  if (answers.a5 !== 'yes') answers.a6 = undefined

  if (answers.a7 !== 'yes') {
    answers.spousePersonId = undefined
    answers.a9 = undefined
    answers.a10 = undefined
  }
  if (answers.a9 !== 'yes') answers.a10 = undefined
  if (!partnerQuestionVisible(answers)) answers.a11 = undefined
  if (answers.a11 !== 'yes') answers.partnerPersonId = undefined

  // Children and dependants
  if (answers.f1 !== 'yes') {
    answers.minorChildIds = []
    answers.g1 = undefined
    answers.guardianIds = []
    answers.g3 = undefined
    answers.replacementGuardianIds = []
  }
  if (answers.f3 !== 'yes') answers.dependantAdultChildIds = []
  if (answers.f5 !== 'yes') answers.otherDependantIds = []

  // Executors and guardians
  if (answers.e3 !== 'yes') answers.replacementExecutorIds = []
  if (answers.g1 !== 'yes') {
    answers.guardianIds = []
    answers.g3 = undefined
    answers.replacementGuardianIds = []
  }
  if (answers.g3 !== 'yes') answers.replacementGuardianIds = []

  // Money and property
  if (answers.p1 !== 'yes') answers.jointAssets = []
  if (answers.p3 !== 'yes') answers.p4 = undefined

  // Specific gifts
  if (answers.sg1 !== 'yes') answers.gifts = []

  // Route C issue text: keep only text for issues still active.
  const activeIssues = new Set<IssueCode>(computeIssues(answers))
  const nextIssueText: WillAnswers['cIssueText'] = {}
  ;(Object.keys(answers.cIssueText) as IssueCode[]).forEach((code) => {
    if (activeIssues.has(code)) nextIssueText[code] = answers.cIssueText[code]
  })
  answers.cIssueText = nextIssueText
  if (!activeIssues.has('JOINT_WILL')) answers.cJointOtherName = undefined

  pruneUnreferenced(answers)
  return answers
}
