import { computeDerived, computeIssues } from './routeEngine'
import { fullName } from './format'
import type { WillAnswers, WillDerived } from './types'

// Destination returned by the resolver: a step id, or 'cya' for Check your
// answers.
export type Destination = string

// A-page applicability given the current answers (conditional visibility).
export function aPageApplicable(answers: WillAnswers, id: string): boolean {
  switch (id) {
    case 'a1':
    case 'a2':
    case 'a3':
    case 'a4':
    case 'a5':
    case 'a7':
    case 'a13':
      return true
    case 'a6':
      return answers.a5 === 'yes'
    case 'a8':
    case 'a9':
      return answers.a7 === 'yes'
    case 'a10':
      return answers.a7 === 'yes' && answers.a9 === 'yes'
    case 'a11':
      return answers.a7 === 'no' || (answers.a7 === 'yes' && answers.a9 === 'yes')
    case 'a12':
      return answers.a11 === 'yes'
    default:
      return false
  }
}

const A_ORDER = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10', 'a11', 'a12', 'a13']

// Whether an A page has an answer, for the Route C replay.
export function aPageAnswered(answers: WillAnswers, id: string): boolean {
  switch (id) {
    case 'a1':
      return Boolean(answers.testatorName?.firstName?.trim() && answers.testatorName?.lastName?.trim())
    case 'a2':
      return Boolean(
        answers.testatorAddress?.line1?.trim() &&
          answers.testatorAddress?.townOrCity?.trim() &&
          answers.testatorAddress?.country?.trim(),
      )
    case 'a3':
      return answers.a3 !== undefined
    case 'a4':
      return answers.a4 !== undefined && (answers.a4 !== 'yes' || answers.a4Countries.length > 0)
    case 'a5':
      return answers.a5 !== undefined
    case 'a6':
      return answers.a6 !== undefined
    case 'a7':
      return answers.a7 !== undefined
    case 'a8':
      return Boolean(answers.spousePersonId)
    case 'a9':
      return answers.a9 !== undefined
    case 'a10':
      return answers.a10 !== undefined
    case 'a11':
      return answers.a11 !== undefined
    case 'a12':
      return Boolean(answers.partnerPersonId)
    case 'a13':
      return answers.a13 !== undefined
    default:
      return false
  }
}

function applicableAOrder(answers: WillAnswers): string[] {
  return A_ORDER.filter((id) => aPageApplicable(answers, id))
}

// Next applicable, unanswered A page for the Route C replay; 'c2' when none.
export function nextUnansweredAPage(answers: WillAnswers, afterId?: string): Destination {
  const order = applicableAOrder(answers)
  const start = afterId ? order.indexOf(afterId) + 1 : 0
  for (let i = start; i < order.length; i += 1) {
    if (!aPageAnswered(answers, order[i])) return order[i]
  }
  return 'c2'
}

function familyCollected(answers: WillAnswers): boolean {
  return answers.f1 !== undefined
}

// Route C family sub-flow used inside C3 when family details are not collected.
function nextFamilyRouteC(answers: WillAnswers, fromId: string): Destination {
  switch (fromId) {
    case 'f1':
      return answers.f1 === 'yes' ? 'f2' : 'f3'
    case 'f2':
      return 'f3'
    case 'f3':
      return answers.f3 === 'yes' ? 'f4' : 'f5'
    case 'f4':
      return 'f5'
    case 'f5':
      return answers.f5 === 'yes' ? 'f6' : 'c3'
    case 'f6':
      return 'c3'
    default:
      return 'c3'
  }
}

// The next visible page in the forward journey. Terminal outcomes (t1 to t4)
// are returned by the suitability pages themselves; this resolves everything
// after an answer is saved.
export function nextStep(answers: WillAnswers, derived: WillDerived, fromId: string): Destination {
  const routeC = derived.route === 'C'
  const afterExecutors = () => (answers.f1 === 'yes' ? 'g1' : 'p1')

  switch (fromId) {
    // Suitability
    case 's1':
      return answers.s1 === 'no' ? 't1' : 's2'
    case 's2':
      return 's3'
    case 's3':
      return answers.s3 === 'no' || answers.s3 === 'not-sure' ? 't3' : 's4'
    case 's4':
      return answers.s4 === 'no' ? 's5' : 's6'
    case 's5':
      return answers.s5 === 'no' ? 't4' : 's6'
    case 's6':
      return 's7'
    case 's7':
      return answers.s7 === 'yes' ? 'c1' : 'a1'

    // About you
    case 'a1':
      return routeC && answers.cIntroSeen ? nextUnansweredAPage(answers, 'a1') : 'a2'
    case 'a2':
      return routeC && answers.cIntroSeen ? nextUnansweredAPage(answers, 'a2') : 'a3'
    case 'a3':
      return routeC && answers.cIntroSeen ? nextUnansweredAPage(answers, 'a3') : 'a4'
    case 'a4':
      return routeC && answers.cIntroSeen ? nextUnansweredAPage(answers, 'a4') : 'a5'
    case 'a5':
      if (routeC && answers.cIntroSeen) return nextUnansweredAPage(answers, 'a5')
      if (answers.a5 === 'no') return 'a7'
      if (answers.a5 === 'yes') return 'a6'
      return 'c1'
    case 'a6':
      if (routeC && answers.cIntroSeen) return nextUnansweredAPage(answers, 'a6')
      return answers.a6 === 'yes' ? 'a7' : 'c1'
    case 'a7':
      if (routeC && answers.cIntroSeen) return nextUnansweredAPage(answers, 'a7')
      return answers.a7 === 'yes' ? 'a8' : 'a11'
    case 'a8':
      return routeC && answers.cIntroSeen ? nextUnansweredAPage(answers, 'a8') : 'a9'
    case 'a9':
      if (routeC && answers.cIntroSeen) return nextUnansweredAPage(answers, 'a9')
      return answers.a9 === 'yes' ? 'a10' : 'a13'
    case 'a10':
      return routeC && answers.cIntroSeen ? nextUnansweredAPage(answers, 'a10') : 'a11'
    case 'a11':
      if (routeC && answers.cIntroSeen) return nextUnansweredAPage(answers, 'a11')
      return answers.a11 === 'yes' ? 'a12' : 'a13'
    case 'a12':
      return routeC && answers.cIntroSeen ? nextUnansweredAPage(answers, 'a12') : 'a13'
    case 'a13':
      return routeC && answers.cIntroSeen ? nextUnansweredAPage(answers, 'a13') : 'f1'

    // Children and dependants
    case 'f1':
      if (answers.f1 === 'yes') return 'f2'
      return routeC ? nextFamilyRouteC(answers, 'f1') : 'f3'
    case 'f2':
      return 'f3'
    case 'f3':
      if (answers.f3 === 'yes') return 'f4'
      return routeC ? 'f5' : 'f5'
    case 'f4':
      return 'f5'
    case 'f5':
      if (answers.f5 === 'yes') return 'f6'
      return routeC ? 'c3' : 'e1'
    case 'f6':
      return routeC ? 'c3' : 'e1'

    // Executors
    case 'e1':
      return 'e2'
    case 'e2':
      return 'e3'
    case 'e3':
      return answers.e3 === 'yes' ? 'e4' : afterExecutors()
    case 'e4':
      return afterExecutors()

    // Guardians
    case 'g1':
      return answers.g1 === 'yes' ? 'g2' : 'p1'
    case 'g2':
      return 'g3'
    case 'g3':
      return answers.g3 === 'yes' ? 'g4' : 'p1'
    case 'g4':
      return 'p1'

    // Money and property
    case 'p1':
      return answers.p1 === 'yes' ? 'p2' : 'p3'
    case 'p2':
      return 'p3'
    case 'p3':
      return answers.p3 === 'yes' ? 'p4' : 'p5'
    case 'p4':
      return 'p5'
    case 'p5':
      return 'p6'
    case 'p6':
      return 'p7'
    case 'p7':
      return 'p8'
    case 'p8':
      return derived.route === 'C' ? 'c1' : 'sg1'

    // Specific gifts and remainder
    case 'sg1':
      return answers.sg1 === 'yes' ? 'sg2' : 'r1'
    case 'sg2':
      return 'r1'
    case 'r1':
      return 'r2'
    case 'r2':
      return 'cya'

    // Route C
    case 'c1':
      return nextUnansweredAPage(answers, undefined)
    case 'c2':
      return familyCollected(answers) ? 'c3' : 'f1'
    case 'c3':
      return 'c4'
    case 'c4':
      return 'c5'
    case 'c5':
      return 'cya'

    default:
      return 'cya'
  }
}

// The earliest unanswered required page when a change moves the journey back to
// Route A or B, so only missing answers are collected before Check your answers.
export function firstUnansweredRouteAB(answers: WillAnswers): Destination {
  const derived = computeDerived(answers)
  let current: Destination = 'a1'
  const visited = new Set<string>()
  while (current !== 'cya') {
    if (visited.has(current)) return 'cya'
    visited.add(current)
    if (!stepAnswered(answers, derived, current)) return current
    current = nextStep(answers, derived, current)
  }
  return 'cya'
}

// Whether a forward page already has the answers it requires.
export function stepAnswered(answers: WillAnswers, derived: WillDerived, id: string): boolean {
  if (id.startsWith('a')) {
    if (A_ORDER.includes(id)) return aPageAnswered(answers, id)
  }
  switch (id) {
    case 'f1':
      return answers.f1 !== undefined
    case 'f2':
      return answers.minorChildIds.length > 0
    case 'f3':
      return answers.f3 !== undefined
    case 'f4':
      return answers.dependantAdultChildIds.length > 0
    case 'f5':
      return answers.f5 !== undefined
    case 'f6':
      return answers.otherDependantIds.length > 0
    case 'e1':
      return true
    case 'e2':
      return answers.executorIds.length > 0
    case 'e3':
      return answers.e3 !== undefined
    case 'e4':
      return answers.replacementExecutorIds.length > 0
    case 'g1':
      return answers.g1 !== undefined
    case 'g2':
      return answers.guardianIds.length > 0
    case 'g3':
      return answers.g3 !== undefined
    case 'g4':
      return answers.replacementGuardianIds.length > 0
    case 'p1':
      return answers.p1 !== undefined
    case 'p2':
      return answers.jointAssets.length > 0
    case 'p3':
      return answers.p3 !== undefined
    case 'p4':
      return answers.p4 !== undefined
    case 'p5':
      return answers.p5 !== undefined
    case 'p6':
      return answers.p6 !== undefined
    case 'p7':
      return answers.p7 !== undefined
    case 'p8':
      return answers.p8 !== undefined
    case 'r1':
      return true
    case 'sg1':
      return answers.sg1 !== undefined
    case 'sg2':
      return answers.gifts.length > 0
    case 'r2':
      return answers.remainder.length > 0
    default:
      return true
  }
}

// Whether every recorded Route C issue has an answer (and the joint-will name).
export function c2Complete(answers: WillAnswers): boolean {
  const issues = computeIssues(answers)
  for (const code of issues) {
    if (!(answers.cIssueText[code] ?? '').trim()) return false
  }
  if (issues.includes('JOINT_WILL')) {
    const name = answers.cJointOtherName
    if (!name?.firstName?.trim() || !name?.lastName?.trim()) return false
  }
  return true
}

// Earliest unanswered required Route C page; 'cya' when the Route C journey is
// complete.
export function firstUnansweredRouteC(answers: WillAnswers): Destination {
  if (!answers.cIntroSeen) return 'c1'
  const aPage = nextUnansweredAPage(answers)
  if (aPage !== 'c2') return aPage
  if (!c2Complete(answers)) return 'c2'
  if (!familyCollected(answers)) return 'f1'
  if (answers.cIncludes.length === 0) return 'c3'
  if (answers.cAssets.length === 0) return 'c4'
  return 'cya'
}

// Destination after a Change is saved, applying the route-transition rules.
export function changeDestination(answers: WillAnswers, derived: WillDerived): Destination {
  if (derived.terminal) return derived.terminal
  if (derived.route === 'C') return firstUnansweredRouteC(answers)
  return firstUnansweredRouteAB(answers)
}

// Label used for a shared person radio option: "name, relationship".
export function personOptionLabel(answers: WillAnswers, id: string): string {
  const person = answers.people.find((record) => record.id === id)
  if (!person) return ''
  const name = fullName(person.name)
  let relationship = person.relationship ?? ''
  if (answers.spousePersonId === id) relationship = 'Husband or wife'
  if (answers.partnerPersonId === id) relationship = 'Partner'
  return relationship ? `${name}, ${relationship}` : name
}
