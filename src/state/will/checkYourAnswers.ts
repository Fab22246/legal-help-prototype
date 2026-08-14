import {
  addressLine,
  displayYesNo,
  findOrganisationName,
  findPerson,
  formatDateParts,
  fullName,
  relationshipLabel,
} from './format'
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

export type CyaItem = { kind: 'row'; row: CyaRow } | { kind: 'record'; record: CyaRecord }

export interface CyaSection {
  heading: string
  items: CyaItem[]
}

export interface CyaModel {
  route: RouteId
  intro: string
  sections: CyaSection[]
  finalButtonLabel: string
  totalPercentage?: string
}

const C3_ROLE_LABEL = 'What you want this person or organisation to do or receive'

function row(label: string, value: string, changeKey?: string, changeName?: string): CyaItem {
  return { kind: 'row', row: { label, value, changeKey, changeName } }
}

function record(rows: CyaRow[], changeKey: string, changeName: string): CyaItem {
  return { kind: 'record', record: { rows, changeKey, changeName } }
}

function plain(label: string, value: string): CyaRow {
  return { label, value }
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

function personCardRows(answers: WillAnswers, id: string, includeSupport: boolean): CyaRow[] {
  const person = findPerson(answers, id)
  if (!person) return []
  const rows: CyaRow[] = [plain('Full name', fullName(person.name))]
  if (person.dateOfBirth) rows.push(plain('Date of birth', formatDateParts(person.dateOfBirth)))
  rows.push(plain('Relationship', relationshipLabel(answers, person)))
  if (includeSupport && person.supportProvided) rows.push(plain('Support provided', person.supportProvided.trim()))
  return rows
}

function personCards(answers: WillAnswers, ids: string[], includeSupport: boolean): CyaItem[] {
  return ids
    .filter((id) => findPerson(answers, id))
    .map((id) =>
      record(personCardRows(answers, id, includeSupport), `person:${id}`, fullName(findPerson(answers, id)?.name)),
    )
}

function roleCards(answers: WillAnswers, ids: string[], roleLabel: string): CyaItem[] {
  return ids
    .filter((id) => findPerson(answers, id))
    .map((id) => {
      const person = findPerson(answers, id)!
      return record(
        [
          plain('Full name', fullName(person.name)),
          plain('Relationship', relationshipLabel(answers, person)),
          plain('Address', addressLine(person.address)),
        ],
        `${roleLabel}:${id}`,
        `${roleLabel}, ${fullName(person.name)}`,
      )
    })
}

function suitabilityItems(answers: WillAnswers): CyaItem[] {
  const items: CyaItem[] = [
    row('Making your own will', displayYesNo(answers.s1), 's1', 'Change making your own will'),
    row('Anyone pressuring or forcing you to make decisions', 'No', 's2', 'Change anyone pressuring or forcing you to make decisions'),
    row('Can understand and make the decisions yourself', displayYesNo(answers.s3), 's3', 'Change can understand and make the decisions yourself'),
    row('Aged 18 or older', displayYesNo(answers.s4), 's4', 'Change aged 18 or older'),
  ]
  if (answers.s4 === 'no') items.push(row('Ever been married', displayYesNo(answers.s5), 's5', 'Change ever been married'))
  items.push(row('Money or property outside Barbados', displayYesNo(answers.s6), 's6', 'Change money or property outside Barbados'))
  items.push(row('Want to make one will together with another person', displayYesNo(answers.s7), 's7', 'Change want to make one will together with another person'))
  return items
}

function aboutYouItems(answers: WillAnswers): CyaItem[] {
  const items: CyaItem[] = [
    row('Full legal name', fullName(answers.testatorName), 'a1', 'Change full legal name'),
    row('Home address', addressLine(answers.testatorAddress), 'a2', 'Change home address'),
    row('Barbados is your main home', displayYesNo(answers.a3), 'a3', 'Change Barbados is your main home'),
    row('Citizen of another country', displayYesNo(answers.a4), 'a4', 'Change citizen of another country'),
  ]
  if (answers.a4Countries.length > 0) {
    items.push(row('Country or countries of other citizenship', answers.a4Countries.join(', '), 'a4', 'Change country or countries of other citizenship'))
  }
  items.push(row('Already have a will', displayYesNo(answers.a5), 'a5', 'Change already have a will'))
  if (answers.a5 === 'yes') items.push(row('Replace all earlier wills', displayYesNo(answers.a6), 'a6', 'Change replace all earlier wills'))
  return items
}

function marriageItems(answers: WillAnswers): CyaItem[] {
  const spouse = findPerson(answers, answers.spousePersonId)
  const partner = findPerson(answers, answers.partnerPersonId)
  const items: CyaItem[] = [row('Currently married', displayYesNo(answers.a7), 'a7', 'Change current marriage')]
  if (spouse) items.push(row('Name of the person you are married to', fullName(spouse.name), 'a8', 'Change name of the person you are married to'))
  if (answers.a9) items.push(row('Separated', displayYesNo(answers.a9), 'a9', 'Change separated'))
  if (answers.a10) items.push(row('Lived apart continuously for 5 years or more', displayYesNo(answers.a10), 'a10', 'Change lived apart continuously for 5 years or more'))
  if (answers.a11) items.push(row('Live with a partner as a couple', displayYesNo(answers.a11), 'a11', 'Change live with a partner as a couple'))
  if (partner) {
    items.push(row("Partner's name", fullName(partner.name), 'a12', "Change partner's name"))
    items.push(row('Lived together continuously for 5 years or more', displayYesNo(partner.livedTogetherFiveYears), 'a12', 'Change lived together continuously for 5 years or more'))
  }
  items.push(row('Planning to get married', displayYesNo(answers.a13), 'a13', 'Change planning to get married'))
  return items
}

function childrenItems(answers: WillAnswers): CyaItem[] {
  const items: CyaItem[] = [row('Children under 18', displayYesNo(answers.f1), 'f1', 'Change children under 18')]
  items.push(...personCards(answers, answers.minorChildIds, false))
  items.push(row('Adult child who depends on you because of a disability', displayYesNo(answers.f3), 'f3', 'Change adult child who depends on you'))
  items.push(...personCards(answers, answers.dependantAdultChildIds, true))
  items.push(row('Anyone else depends on you for money or care', displayYesNo(answers.f5), 'f5', 'Change anyone else depends on you'))
  items.push(...personCards(answers, answers.otherDependantIds, true))
  return items
}

function executorItems(answers: WillAnswers): CyaItem[] {
  const items: CyaItem[] = [...roleCards(answers, answers.executorIds, 'executor')]
  items.push(row('Replacement executor', displayYesNo(answers.e3), 'e3', 'Change replacement executor decision'))
  items.push(...roleCards(answers, answers.replacementExecutorIds, 'replacement executor'))
  return items
}

function guardianItems(answers: WillAnswers): CyaItem[] {
  const items: CyaItem[] = [row('Name a guardian', displayYesNo(answers.g1), 'g1', 'Change name a guardian')]
  items.push(...roleCards(answers, answers.guardianIds, 'guardian'))
  if (answers.g1 === 'yes') items.push(row('Replacement guardian', displayYesNo(answers.g3), 'g3', 'Change replacement guardian decision'))
  items.push(...roleCards(answers, answers.replacementGuardianIds, 'replacement guardian'))
  return items
}

function moneyItems(answers: WillAnswers): CyaItem[] {
  const items: CyaItem[] = [row('Own money or property with someone else', displayYesNo(answers.p1), 'p1', 'Change own money or property with someone else')]
  answers.jointAssets.forEach((asset) =>
    items.push(row('Description', asset.description, `p2:${asset.id}`, 'Change description of jointly owned money or property')),
  )
  items.push(row('Own a business or part of a business', displayYesNo(answers.p3), 'p3', 'Change own a business'))
  if (answers.p3 === 'yes') items.push(row('Want the will to decide who will own or run the business', displayYesNo(answers.p4), 'p4', 'Change want the will to decide who will own or run the business'))
  items.push(row('Disagreement about money or property', displayYesNo(answers.p5), 'p5', 'Change disagreement about money or property'))
  items.push(row('Want someone to use money or property during their lifetime', displayYesNo(answers.p6), 'p6', 'Change want someone to use money or property during their lifetime'))
  items.push(row('Want to set a condition other than age', displayYesNo(answers.p7), 'p7', 'Change want to set a condition other than age'))
  items.push(row('May owe more than everything owned is worth', displayYesNo(answers.p8), 'p8', 'Change may owe more than everything owned is worth'))
  return items
}

function giftCard(answers: WillAnswers, gift: Gift): CyaItem {
  const rows: CyaRow[] = [plain('Gift', giftValue(gift)), plain('Recipient', recipientName(answers, gift.recipientType, gift.recipientPersonId, gift.recipientOrgId))]
  if (gift.recipientType === 'person') {
    const person = findPerson(answers, gift.recipientPersonId)
    if (person) rows.push(plain('Relationship to you', relationshipLabel(answers, person)))
    if (person?.under18Answer !== undefined) rows.push(plain('Under 18', displayYesNo(person.under18Answer)))
    rows.push(plain('What happens if the person dies before you', GIFT_FALLBACK[gift.fallback ?? ''] ?? ''))
  } else {
    rows.push(plain('What happens if the organisation no longer exists', GIFT_FALLBACK[gift.fallback ?? ''] ?? ''))
  }
  if (gift.fallback === 'to-replacement') {
    rows.push(plain('Replacement recipient', recipientName(answers, gift.replacementType, gift.replacementPersonId, gift.replacementOrgId)))
    if (gift.replacementType === 'person') {
      const replacement = findPerson(answers, gift.replacementPersonId)
      if (replacement?.under18Answer !== undefined) rows.push(plain('Replacement recipient under 18', displayYesNo(replacement.under18Answer)))
    }
  }
  return record(rows, `gift:${gift.id}`, `Change specific gift, ${giftValue(gift)}`)
}

function remainderCard(answers: WillAnswers, beneficiary: RemainderBeneficiary): CyaItem {
  const name = recipientName(answers, beneficiary.recipientType, beneficiary.recipientPersonId, beneficiary.recipientOrgId)
  const rows: CyaRow[] = [plain('Recipient', name)]
  if (beneficiary.recipientType === 'person') {
    const person = findPerson(answers, beneficiary.recipientPersonId)
    if (person) rows.push(plain('Relationship to you', relationshipLabel(answers, person)))
    if (person?.under18Answer !== undefined) rows.push(plain('Under 18', displayYesNo(person.under18Answer)))
  }
  rows.push(plain('Percentage', `${(beneficiary.percentage ?? '').trim()}%`))
  const label = beneficiary.recipientType === 'organisation' ? 'What happens if the organisation no longer exists' : 'What happens if the person dies before you'
  rows.push(plain(label, REMAINDER_FALLBACK[beneficiary.fallback ?? ''] ?? ''))
  if (beneficiary.fallback === 'to-replacement') {
    rows.push(plain('Replacement recipient', recipientName(answers, beneficiary.replacementType, beneficiary.replacementPersonId, beneficiary.replacementOrgId)))
    if (beneficiary.replacementType === 'person') {
      const replacement = findPerson(answers, beneficiary.replacementPersonId)
      if (replacement?.under18Answer !== undefined) rows.push(plain('Replacement recipient under 18', displayYesNo(replacement.under18Answer)))
    }
  }
  return record(rows, `remainder:${beneficiary.id}`, `Change remainder share, ${name}`)
}

function specificGiftItems(answers: WillAnswers): CyaItem[] {
  if (answers.sg1 !== 'yes') return [row('Leave a particular gift', 'No', 'sg1', 'Change leave a particular gift')]
  return answers.gifts.map((gift) => giftCard(answers, gift))
}

const C2_LABELS: Record<string, string> = {
  JOINT_WILL: 'What do you and the other person want the will to do?',
  EXISTING_WILL_UNCERTAIN: 'What do you know about the will you may already have?',
  EXISTING_WILL_NOT_REPLACED: 'What do you want to keep from your existing will?',
  BUSINESS_SUCCESSION: 'What do you want to happen to the business?',
  OWNERSHIP_DISPUTE: 'What money or property is disputed?',
  LIFETIME_INTEREST: 'Who should use the money or property during their lifetime, and who should receive it afterwards?',
  CONDITIONAL_GIFT: 'What condition do you want to set?',
  POSSIBLE_INSOLVENCY: 'What are you concerned about owing?',
}

function routeCLegalAdviceItems(answers: WillAnswers): CyaItem[] {
  const items: CyaItem[] = []
  ;(Object.keys(C2_LABELS) as (keyof typeof C2_LABELS)[]).forEach((code) => {
    const value = (answers.cIssueText[code as keyof typeof answers.cIssueText] ?? '').trim()
    if (value.length > 0) items.push(row(C2_LABELS[code], value, `c2:${code}`, `Change ${C2_LABELS[code].replace(/\?$/, '')}`))
  })
  if (answers.cJointOtherName) items.push(row("Other person's full legal name", fullName(answers.cJointOtherName), 'c2:JOINT_WILL', "Change other person's full legal name"))
  return items
}

function routeCIncludeItems(answers: WillAnswers): CyaItem[] {
  return answers.cIncludes.map((include) => {
    if (include.recipientType === 'organisation') {
      const name = findOrganisationName(answers, include.orgId)
      return record(
        [plain('Person or organisation', 'Organisation'), plain('Full legal name', name), plain(C3_ROLE_LABEL, (include.roleText ?? '').trim())],
        `c3:${include.id}`,
        `Change included organisation, ${name}`,
      )
    }
    const person = findPerson(answers, include.personId)
    const name = fullName(person?.name)
    return record(
      [
        plain('Person or organisation', 'Person'),
        plain('Full legal name', name),
        plain('Relationship to you', person ? relationshipLabel(answers, person) : ''),
        plain(C3_ROLE_LABEL, (include.roleText ?? '').trim()),
      ],
      `c3:${include.id}`,
      `Change included person, ${name}`,
    )
  })
}

function routeCAssetItems(answers: WillAnswers): CyaItem[] {
  return answers.cAssets.map((asset) =>
    record(
      [plain('Type of money or property', asset.type), plain('Description', asset.description), plain('Country', asset.country)],
      `c4:${asset.id}`,
      `Change money or property, ${asset.description}`,
    ),
  )
}

function anyMoneyAnswered(answers: WillAnswers): boolean {
  return [answers.p1, answers.p3, answers.p4, answers.p5, answers.p6, answers.p7, answers.p8].some(Boolean)
}

export function buildCheckYourAnswers(answers: WillAnswers, derived: WillDerived): CyaModel {
  const route = derived.route

  if (route === 'C') {
    const sections: CyaSection[] = [
      { heading: 'Suitability', items: suitabilityItems(answers) },
      { heading: 'About you', items: [...aboutYouItems(answers), ...marriageItems(answers)] },
      { heading: 'Children and people who depend on you', items: childrenItems(answers) },
    ]
    if (anyMoneyAnswered(answers)) sections.push({ heading: 'Money and property', items: moneyItems(answers) })
    sections.push({ heading: 'What you need legal advice about', items: routeCLegalAdviceItems(answers) })
    sections.push({ heading: 'People and organisations to include', items: routeCIncludeItems(answers) })
    sections.push({ heading: 'Money and property to discuss', items: routeCAssetItems(answers) })
    const other = (answers.cOther ?? '').trim()
    if (other.length > 0) {
      sections.push({ heading: 'Other information', items: [row('Other information', other, 'c5', 'Change other information')] })
    }
    return { route, intro: 'Review your answers before creating your information summary.', sections, finalButtonLabel: 'Create my information summary' }
  }

  const sections: CyaSection[] = [
    { heading: 'Suitability', items: suitabilityItems(answers) },
    { heading: 'About you', items: aboutYouItems(answers) },
    { heading: 'Marriage and relationships', items: marriageItems(answers) },
    { heading: 'Children and people who depend on you', items: childrenItems(answers) },
    { heading: 'Executors', items: executorItems(answers) },
  ]
  if (answers.f1 === 'yes') sections.push({ heading: 'Guardians', items: guardianItems(answers) })
  sections.push({ heading: 'Money and property', items: moneyItems(answers) })
  sections.push({ heading: 'Specific gifts', items: specificGiftItems(answers) })
  sections.push({ heading: 'Remainder of your estate', items: answers.remainder.map((b) => remainderCard(answers, b)) })

  const total = formatPercentage(totalPercentageHundredths(answers.remainder))
  return {
    route,
    intro: route === 'B' ? 'Review your answers before creating your will for legal review.' : 'Review your answers before creating your will.',
    sections,
    finalButtonLabel: route === 'B' ? 'Create my will for legal review' : 'Create my will',
    totalPercentage: `${total}%`,
  }
}
