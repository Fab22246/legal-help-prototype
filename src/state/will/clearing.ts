import { activeReferences, computeIssues } from './routeEngine'
import type { Gift, IssueCode, RemainderBeneficiary, RouteCInclude, WillAnswers } from './types'

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

// People who hold an active beneficiary role (primary or an in-use replacement).
// Under-18 answers and dates of birth collected for a beneficiary are kept only
// while such a role remains.
function activeBeneficiaryPersonIds(answers: WillAnswers): Set<string> {
  const ids = new Set<string>()
  const add = (id: string | undefined) => {
    if (id) ids.add(id)
  }
  answers.gifts.forEach((gift) => {
    add(activeReferences.giftPrimaryPerson(gift))
    add(activeReferences.giftReplacementPerson(gift))
  })
  answers.remainder.forEach((beneficiary) => {
    add(activeReferences.remainderPrimaryPerson(beneficiary))
    add(activeReferences.remainderReplacementPerson(beneficiary))
  })
  return ids
}

function normalizeGift(gift: Gift): Gift {
  const next: Gift = { ...gift }
  if (next.kind === 'money') {
    next.description = undefined
  } else {
    next.amount = undefined
    next.currency = undefined
  }
  if (next.recipientType === 'person') next.recipientOrgId = undefined
  else if (next.recipientType === 'organisation') next.recipientPersonId = undefined
  if (next.fallback !== 'to-replacement') {
    next.replacementType = undefined
    next.replacementPersonId = undefined
    next.replacementOrgId = undefined
  } else if (next.replacementType === 'person') {
    next.replacementOrgId = undefined
  } else if (next.replacementType === 'organisation') {
    next.replacementPersonId = undefined
  }
  return next
}

function normalizeRemainder(beneficiary: RemainderBeneficiary, totalCount: number): RemainderBeneficiary {
  const next: RemainderBeneficiary = { ...beneficiary }
  if (next.recipientType === 'person') {
    next.recipientOrgId = undefined
  } else if (next.recipientType === 'organisation') {
    next.recipientPersonId = undefined
    // "Give it to their children" applies only to a person.
    if (next.fallback === 'to-children') next.fallback = undefined
  }
  // "Share among the others" needs another beneficiary to exist.
  if (next.fallback === 'share-among-others' && totalCount <= 1) next.fallback = undefined
  if (next.fallback !== 'to-replacement') {
    next.replacementType = undefined
    next.replacementPersonId = undefined
    next.replacementOrgId = undefined
  } else if (next.replacementType === 'person') {
    next.replacementOrgId = undefined
  } else if (next.replacementType === 'organisation') {
    next.replacementPersonId = undefined
  }
  return next
}

function normalizeInclude(include: RouteCInclude): RouteCInclude {
  const next: RouteCInclude = { ...include }
  if (next.recipientType === 'person') next.orgId = undefined
  else if (next.recipientType === 'organisation') next.personId = undefined
  return next
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

// Enforce every conditional and record-level dependency so hidden answers, stale
// references and the review points and issues derived only from them do not
// persist. Returns a normalised copy.
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

  // Record-level type and fallback consistency
  answers.gifts = answers.gifts.map(normalizeGift)
  answers.remainder = answers.remainder.map((beneficiary) =>
    normalizeRemainder(beneficiary, answers.remainder.length),
  )
  answers.cIncludes = answers.cIncludes.map(normalizeInclude)

  // Under-18 answers and dates of birth are kept only where a role still needs
  // them: a minor child (F2) keeps its date of birth; an active beneficiary
  // keeps both; every other person has both cleared.
  const beneficiaries = activeBeneficiaryPersonIds(answers)
  answers.people = answers.people.map((person) => {
    const isMinor = answers.minorChildIds.includes(person.id)
    const isDependantAdult = answers.dependantAdultChildIds.includes(person.id)
    const isBeneficiary = beneficiaries.has(person.id)

    let keepDob: boolean
    let keepUnder18: boolean
    if (isMinor) {
      // F2 requires the date of birth and supplies under-18 directly, so a
      // redundant direct answer is removed.
      keepDob = true
      keepUnder18 = false
    } else if (isDependantAdult) {
      // F4 supplies "not under 18"; no beneficiary-only answer or date of birth.
      keepDob = false
      keepUnder18 = false
    } else if (isBeneficiary) {
      keepUnder18 = true
      if (person.under18Answer === 'yes') {
        // A date of birth is required when the beneficiary is under 18.
        keepDob = true
      } else if (person.under18Answer === 'no' || person.under18Answer === 'not-sure') {
        // No date is required, so a date collected only for an earlier Yes goes.
        keepDob = false
      } else {
        // No direct answer: keep an existing date of birth to derive status.
        keepDob = true
      }
    } else {
      keepDob = false
      keepUnder18 = false
    }

    if (keepDob && keepUnder18) return person
    const next = { ...person }
    if (!keepDob) next.dateOfBirth = undefined
    if (!keepUnder18) next.under18Answer = undefined
    return next
  })

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
