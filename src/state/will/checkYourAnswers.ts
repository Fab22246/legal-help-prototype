import {
  addressLine,
  displayYesNo,
  findOrganisationName,
  findPerson,
  formatDateParts,
  fullName,
  relationshipLabel,
} from './format'
import { personIsUnderOrMaybe } from './routeEngine'
import type { Gift, RemainderBeneficiary, RouteId, WillAnswers, WillDerived } from './types'

export interface CyaRow {
  label: string
  value: string
  changeKey?: string
  changeName?: string
}

export interface CyaRecord {
  rows: CyaRow[]
  changeKey?: string
  changeName?: string
}

export interface CyaSection {
  heading: string
  rows: CyaRow[]
  records: CyaRecord[]
}

export interface CyaModel {
  route: RouteId
  intro: string
  sections: CyaSection[]
  finalButtonLabel: string
  totalPercentage?: string
}

function row(label: string, value: string, changeKey?: string, changeName?: string): CyaRow {
  return { label, value, changeKey, changeName }
}

function giftValue(gift: Gift): string {
  if (gift.kind === 'money') {
    return [gift.currency, gift.amount].map((part) => (part ?? '').trim()).filter(Boolean).join(' ')
  }
  return (gift.description ?? '').trim()
}

function recipientName(
  answers: WillAnswers,
  type: 'person' | 'organisation' | undefined,
  personId: string | undefined,
  orgId: string | undefined,
): string {
  if (type === 'organisation') return findOrganisationName(answers, orgId)
  return fullName(findPerson(answers, personId)?.name)
}

const GIFT_FALLBACK: Record<string, string> = {
  'to-estate': 'Add the gift to everything left in my estate',
  'to-replacement': 'Give the gift to another person or organisation',
}

const REMAINDER_FALLBACK: Record<string, string> = {
  'share-among-others': 'Share it among the other people or organisations named to receive the remainder',
  'to-children': 'Give it to their children in equal shares',
  'to-replacement': 'Give it to another person or organisation',
}

// Sum percentages using integer hundredths to avoid floating-point drift.
export function totalPercentageHundredths(list: RemainderBeneficiary[]): number {
  return list.reduce((sum, beneficiary) => {
    const text = (beneficiary.percentage ?? '').trim()
    if (!/^\d+(\.\d{1,2})?$/.test(text)) return sum
    return sum + Math.round(Number(text) * 100)
  }, 0)
}

export function formatPercentage(hundredths: number): string {
  const whole = Math.trunc(hundredths / 100)
  const frac = Math.abs(hundredths % 100)
  if (frac === 0) return `${whole}`
  return `${whole}.${frac.toString().padStart(2, '0')}`.replace(/0$/, '')
}

function personRecords(answers: WillAnswers, ids: string[], includeSupport: boolean): CyaRecord[] {
  return ids
    .map((id) => findPerson(answers, id))
    .filter((person): person is NonNullable<typeof person> => Boolean(person))
    .map((person) => {
      const rows: CyaRow[] = [row('Full name', fullName(person.name))]
      if (person.dateOfBirth) rows.push(row('Date of birth', formatDateParts(person.dateOfBirth)))
      rows.push(row('Relationship', relationshipLabel(answers, person)))
      if (includeSupport && person.supportProvided) rows.push(row('Support provided', person.supportProvided.trim()))
      return { rows, changeKey: `person:${person.id}`, changeName: `Change ${fullName(person.name)}` }
    })
}

function executorRecords(answers: WillAnswers, ids: string[], namePrefix: string): CyaRecord[] {
  return ids
    .map((id) => findPerson(answers, id))
    .filter((person): person is NonNullable<typeof person> => Boolean(person))
    .map((person) => ({
      rows: [
        row('Full name', fullName(person.name)),
        row('Relationship', relationshipLabel(answers, person)),
        row('Address', addressLine(person.address)),
      ],
      changeKey: `${namePrefix}:${person.id}`,
      changeName: `Change ${namePrefix}, ${fullName(person.name)}`,
    }))
}

function suitabilitySection(answers: WillAnswers): CyaSection {
  const rows: CyaRow[] = [
    row('Making your own will', displayYesNo(answers.s1), 's1', 'Change making your own will'),
    row('Anyone pressuring or forcing you to make decisions', 'No', 's2', 'Change anyone pressuring or forcing you to make decisions'),
    row('Can understand and make the decisions yourself', displayYesNo(answers.s3), 's3', 'Change can understand and make the decisions yourself'),
    row('Aged 18 or older', displayYesNo(answers.s4), 's4', 'Change aged 18 or older'),
  ]
  if (answers.s4 === 'no') rows.push(row('Ever been married', displayYesNo(answers.s5), 's5', 'Change ever been married'))
  rows.push(row('Money or property outside Barbados', displayYesNo(answers.s6), 's6', 'Change money or property outside Barbados'))
  rows.push(row('Want to make one will together with another person', displayYesNo(answers.s7), 's7', 'Change want to make one will together with another person'))
  return { heading: 'Suitability', rows, records: [] }
}

function aboutYouSection(answers: WillAnswers): CyaSection {
  const rows: CyaRow[] = [
    row('Full legal name', fullName(answers.testatorName), 'a1', 'Change full legal name'),
    row('Home address', addressLine(answers.testatorAddress), 'a2', 'Change home address'),
    row('Barbados is your main home', displayYesNo(answers.a3), 'a3', 'Change Barbados is your main home'),
    row('Citizen of another country', displayYesNo(answers.a4), 'a4', 'Change citizen of another country'),
  ]
  if (answers.a4Countries.length > 0) {
    rows.push(row('Country or countries of other citizenship', answers.a4Countries.join(', '), 'a4', 'Change country or countries of other citizenship'))
  }
  rows.push(row('Already have a will', displayYesNo(answers.a5), 'a5', 'Change already have a will'))
  if (answers.a5 === 'yes') rows.push(row('Replace all earlier wills', displayYesNo(answers.a6), 'a6', 'Change replace all earlier wills'))
  return { heading: 'About you', rows, records: [] }
}

function marriageSection(answers: WillAnswers): CyaSection {
  const spouse = findPerson(answers, answers.spousePersonId)
  const partner = findPerson(answers, answers.partnerPersonId)
  const rows: CyaRow[] = [row('Currently married', displayYesNo(answers.a7), 'a7', 'Change current marriage')]
  if (spouse) rows.push(row('Name of the person you are married to', fullName(spouse.name), 'a8', 'Change name of the person you are married to'))
  if (answers.a9) rows.push(row('Separated', displayYesNo(answers.a9), 'a9', 'Change separated'))
  if (answers.a10) rows.push(row('Lived apart continuously for 5 years or more', displayYesNo(answers.a10), 'a10', 'Change lived apart continuously for 5 years or more'))
  if (answers.a11) rows.push(row('Live with a partner as a couple', displayYesNo(answers.a11), 'a11', 'Change live with a partner as a couple'))
  if (partner) {
    rows.push(row("Partner's name", fullName(partner.name), 'a12', "Change partner's name"))
    rows.push(row('Lived together continuously for 5 years or more', displayYesNo(partner.livedTogetherFiveYears), 'a12', 'Change lived together continuously for 5 years or more'))
  }
  rows.push(row('Planning to get married', displayYesNo(answers.a13), 'a13', 'Change planning to get married'))
  return { heading: 'Marriage and relationships', rows, records: [] }
}

function childrenSection(answers: WillAnswers): CyaSection {
  const rows: CyaRow[] = [row('Children under 18', displayYesNo(answers.f1), 'f1', 'Change children under 18')]
  const records: CyaRecord[] = [...personRecords(answers, answers.minorChildIds, false)]
  rows.push(row('Adult child who depends on you because of a disability', displayYesNo(answers.f3), 'f3', 'Change adult child who depends on you'))
  records.push(...personRecords(answers, answers.dependantAdultChildIds, true))
  rows.push(row('Anyone else depends on you for money or care', displayYesNo(answers.f5), 'f5', 'Change anyone else depends on you'))
  records.push(...personRecords(answers, answers.otherDependantIds, true))
  return { heading: 'Children and people who depend on you', rows, records }
}

function executorsSection(answers: WillAnswers): CyaSection {
  const rows: CyaRow[] = [row('Replacement executor', displayYesNo(answers.e3), 'e3', 'Change replacement executor decision')]
  const records = [
    ...executorRecords(answers, answers.executorIds, 'executor'),
    ...executorRecords(answers, answers.replacementExecutorIds, 'replacement executor'),
  ]
  return { heading: 'Executors', rows, records }
}

function guardiansSection(answers: WillAnswers): CyaSection {
  const rows: CyaRow[] = [row('Name a guardian', displayYesNo(answers.g1), 'g1', 'Change name a guardian')]
  if (answers.g1 === 'yes') rows.push(row('Replacement guardian', displayYesNo(answers.g3), 'g3', 'Change replacement guardian decision'))
  const records = [
    ...executorRecords(answers, answers.guardianIds, 'guardian'),
    ...executorRecords(answers, answers.replacementGuardianIds, 'replacement guardian'),
  ]
  return { heading: 'Guardians', rows, records }
}

function moneySection(answers: WillAnswers): CyaSection {
  const rows: CyaRow[] = [row('Own money or property with someone else', displayYesNo(answers.p1), 'p1', 'Change own money or property with someone else')]
  answers.jointAssets.forEach((asset) => rows.push(row('Description', asset.description, 'p2', 'Change description of jointly owned money or property')))
  rows.push(row('Own a business or part of a business', displayYesNo(answers.p3), 'p3', 'Change own a business'))
  if (answers.p3 === 'yes') rows.push(row('Want the will to decide who will own or run the business', displayYesNo(answers.p4), 'p4', 'Change want the will to decide who will own or run the business'))
  rows.push(row('Disagreement about money or property', displayYesNo(answers.p5), 'p5', 'Change disagreement about money or property'))
  rows.push(row('Want someone to use money or property during their lifetime', displayYesNo(answers.p6), 'p6', 'Change want someone to use money or property during their lifetime'))
  rows.push(row('Want to set a condition other than age', displayYesNo(answers.p7), 'p7', 'Change want to set a condition other than age'))
  rows.push(row('May owe more than everything owned is worth', displayYesNo(answers.p8), 'p8', 'Change may owe more than everything owned is worth'))
  return { heading: 'Money and property', rows, records: [] }
}

function giftRecord(answers: WillAnswers, gift: Gift): CyaRecord {
  const rows: CyaRow[] = [row('Gift', giftValue(gift)), row('Recipient', recipientName(answers, gift.recipientType, gift.recipientPersonId, gift.recipientOrgId))]
  if (gift.recipientType === 'person') {
    const person = findPerson(answers, gift.recipientPersonId)
    if (person) rows.push(row('Relationship to you', relationshipLabel(answers, person)))
    if (personIsUnderOrMaybe(answers, gift.recipientPersonId)) rows.push(row('Under 18', 'Yes'))
    rows.push(row('What happens if the person dies before you', GIFT_FALLBACK[gift.fallback ?? ''] ?? ''))
  } else {
    rows.push(row('What happens if the organisation no longer exists', GIFT_FALLBACK[gift.fallback ?? ''] ?? ''))
  }
  if (gift.fallback === 'to-replacement') {
    rows.push(row('Replacement recipient', recipientName(answers, gift.replacementType, gift.replacementPersonId, gift.replacementOrgId)))
  }
  return { rows, changeKey: `gift:${gift.id}`, changeName: `Change specific gift, ${giftValue(gift)}` }
}

function specificGiftsSection(answers: WillAnswers): CyaSection {
  if (answers.sg1 !== 'yes') {
    return {
      heading: 'Specific gifts',
      rows: [row('Leave a particular gift', 'No', 'sg1', 'Change leave a particular gift')],
      records: [],
    }
  }
  return { heading: 'Specific gifts', rows: [], records: answers.gifts.map((gift) => giftRecord(answers, gift)) }
}

function remainderRecord(answers: WillAnswers, beneficiary: RemainderBeneficiary): CyaRecord {
  const name = recipientName(answers, beneficiary.recipientType, beneficiary.recipientPersonId, beneficiary.recipientOrgId)
  const rows: CyaRow[] = [row('Recipient', name)]
  if (beneficiary.recipientType === 'person') {
    const person = findPerson(answers, beneficiary.recipientPersonId)
    if (person) rows.push(row('Relationship to you', relationshipLabel(answers, person)))
  }
  rows.push(row('Percentage', `${(beneficiary.percentage ?? '').trim()}%`))
  const label = beneficiary.recipientType === 'organisation' ? 'What happens if the organisation no longer exists' : 'What happens if the person dies before you'
  rows.push(row(label, REMAINDER_FALLBACK[beneficiary.fallback ?? ''] ?? ''))
  if (beneficiary.fallback === 'to-replacement') {
    rows.push(row('Replacement recipient', recipientName(answers, beneficiary.replacementType, beneficiary.replacementPersonId, beneficiary.replacementOrgId)))
  }
  return { rows, changeKey: `remainder:${beneficiary.id}`, changeName: `Change remainder share, ${name}` }
}

function routeCLegalAdvice(answers: WillAnswers): CyaSection {
  const rows: CyaRow[] = []
  const labels: Record<string, string> = {
    JOINT_WILL: 'What do you and the other person want the will to do?',
    EXISTING_WILL_UNCERTAIN: 'What do you know about the will you may already have?',
    EXISTING_WILL_NOT_REPLACED: 'What do you want to keep from your existing will?',
    BUSINESS_SUCCESSION: 'What do you want to happen to the business?',
    OWNERSHIP_DISPUTE: 'What money or property is disputed?',
    LIFETIME_INTEREST: 'Who should use the money or property during their lifetime, and who should receive it afterwards?',
    CONDITIONAL_GIFT: 'What condition do you want to set?',
    POSSIBLE_INSOLVENCY: 'What are you concerned about owing?',
  }
  ;(Object.keys(labels) as (keyof typeof labels)[]).forEach((code) => {
    const value = (answers.cIssueText[code as keyof typeof answers.cIssueText] ?? '').trim()
    if (value.length > 0) rows.push(row(labels[code], value, `c2:${code}`, `Change ${labels[code].replace(/\?$/, '')}`))
  })
  if (answers.cJointOtherName) rows.push(row("Other person's full legal name", fullName(answers.cJointOtherName), 'c2:JOINT_WILL', "Change other person's full legal name"))
  return { heading: 'What you need legal advice about', rows, records: [] }
}

function routeCIncludes(answers: WillAnswers): CyaSection {
  const records: CyaRecord[] = answers.cIncludes.map((include) => {
    if (include.recipientType === 'organisation') {
      const name = findOrganisationName(answers, include.orgId)
      return {
        rows: [
          row('Person or organisation', 'Organisation'),
          row('Full legal name', name),
          row('What you want them to do or receive', (include.roleText ?? '').trim()),
        ],
        changeKey: `c3:${include.id}`,
        changeName: `Change included organisation, ${name}`,
      }
    }
    const person = findPerson(answers, include.personId)
    const name = fullName(person?.name)
    return {
      rows: [
        row('Person or organisation', 'Person'),
        row('Full legal name', name),
        row('Relationship to you', person ? relationshipLabel(answers, person) : ''),
        row('What you want them to do or receive', (include.roleText ?? '').trim()),
      ],
      changeKey: `c3:${include.id}`,
      changeName: `Change included person, ${name}`,
    }
  })
  return { heading: 'People and organisations to include', rows: [], records }
}

function routeCAssets(answers: WillAnswers): CyaSection {
  const records: CyaRecord[] = answers.cAssets.map((asset) => ({
    rows: [row('Type of money or property', asset.type), row('Description', asset.description), row('Country', asset.country)],
    changeKey: `c4:${asset.id}`,
    changeName: `Change money or property, ${asset.description}`,
  }))
  return { heading: 'Money and property to discuss', rows: [], records }
}

// True when any P1 to P8 answer was recorded (so the Route C money section applies).
function anyMoneyAnswered(answers: WillAnswers): boolean {
  return [answers.p1, answers.p3, answers.p4, answers.p5, answers.p6, answers.p7, answers.p8].some(Boolean)
}

export function buildCheckYourAnswers(answers: WillAnswers, derived: WillDerived): CyaModel {
  const route = derived.route

  if (route === 'C') {
    const sections: CyaSection[] = [suitabilitySection(answers), aboutYouSection(answers), marriageSection(answers), childrenSection(answers)]
    if (anyMoneyAnswered(answers)) sections.push(moneySection(answers))
    sections.push(routeCLegalAdvice(answers), routeCIncludes(answers), routeCAssets(answers))
    const other = (answers.cOther ?? '').trim()
    if (other.length > 0) {
      sections.push({ heading: 'Other information', rows: [row('Other information', other, 'c5', 'Change other information')], records: [] })
    }
    return {
      route,
      intro: 'Review your answers before creating your information summary.',
      sections,
      finalButtonLabel: 'Create my information summary',
    }
  }

  const sections: CyaSection[] = [
    suitabilitySection(answers),
    aboutYouSection(answers),
    marriageSection(answers),
    childrenSection(answers),
    executorsSection(answers),
  ]
  if (answers.f1 === 'yes') sections.push(guardiansSection(answers))
  sections.push(moneySection(answers))
  sections.push(specificGiftsSection(answers))
  sections.push({ heading: 'Remainder of your estate', rows: [], records: answers.remainder.map((b) => remainderRecord(answers, b)) })

  const total = formatPercentage(totalPercentageHundredths(answers.remainder))
  return {
    route,
    intro: route === 'B' ? 'Review your answers before creating your will for legal review.' : 'Review your answers before creating your will.',
    sections,
    finalButtonLabel: route === 'B' ? 'Create my will for legal review' : 'Create my will',
    totalPercentage: `${total}%`,
  }
}
