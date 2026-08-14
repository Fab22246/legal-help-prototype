import {
  addressRows,
  displayYesNo,
  findOrganisationName,
  findPerson,
  formatDateParts,
  fullName,
  relationshipLabel,
} from './format'
import type { IssueCode, WillAnswers } from './types'

export interface InfoRow {
  label: string
  value: string
}

export type InfoItem = { kind: 'row'; row: InfoRow } | { kind: 'record'; rows: InfoRow[] }

export interface InfoSection {
  heading: string
  items: InfoItem[]
}

export interface InfoSummaryDocument {
  title: string
  name: string
  homeAddress: InfoRow[]
  dateCreated: string
  opening: string
  sections: InfoSection[]
}

const C3_ROLE_LABEL = 'What you want this person or organisation to do or receive'

const ISSUE_LABELS: Record<IssueCode, string> = {
  JOINT_WILL: 'What do you and the other person want the will to do?',
  EXISTING_WILL_UNCERTAIN: 'What do you know about the will you may already have?',
  EXISTING_WILL_NOT_REPLACED: 'What do you want to keep from your existing will?',
  BUSINESS_SUCCESSION: 'What do you want to happen to the business?',
  OWNERSHIP_DISPUTE: 'What money or property is disputed?',
  LIFETIME_INTEREST: 'Who should use the money or property during their lifetime, and who should receive it afterwards?',
  CONDITIONAL_GIFT: 'What condition do you want to set?',
  POSSIBLE_INSOLVENCY: 'What are you concerned about owing?',
}

const ISSUE_ORDER: IssueCode[] = [
  'JOINT_WILL',
  'EXISTING_WILL_UNCERTAIN',
  'EXISTING_WILL_NOT_REPLACED',
  'BUSINESS_SUCCESSION',
  'OWNERSHIP_DISPUTE',
  'LIFETIME_INTEREST',
  'CONDITIONAL_GIFT',
  'POSSIBLE_INSOLVENCY',
]

function rowItem(label: string, value: string): InfoItem {
  return { kind: 'row', row: { label, value } }
}

function recordItem(rows: InfoRow[]): InfoItem {
  return { kind: 'record', rows: rows.filter((row) => row.value.length > 0) }
}

function keepRows(items: InfoItem[]): InfoItem[] {
  return items.filter((item) => (item.kind === 'row' ? item.row.value.length > 0 : item.rows.length > 0))
}

function aboutYou(answers: WillAnswers): InfoSection {
  const items: InfoItem[] = [
    rowItem('Barbados is your main home', displayYesNo(answers.a3)),
    rowItem('Citizen of another country', displayYesNo(answers.a4)),
    ...answers.a4Countries.map((country) => rowItem('Country', country)),
    rowItem('Already have a will', displayYesNo(answers.a5)),
  ]
  if (answers.a5 === 'yes') items.push(rowItem('Replace all earlier wills', displayYesNo(answers.a6)))
  return { heading: 'About you', items: keepRows(items) }
}

function marriage(answers: WillAnswers): InfoSection {
  const spouse = findPerson(answers, answers.spousePersonId)
  const partner = findPerson(answers, answers.partnerPersonId)
  const items: InfoItem[] = [rowItem('Currently married', displayYesNo(answers.a7))]
  if (spouse) items.push(rowItem('Name of the person you are married to', fullName(spouse.name)))
  if (answers.a9) items.push(rowItem('Separated', displayYesNo(answers.a9)))
  if (answers.a10) items.push(rowItem('Lived apart continuously for 5 years or more', displayYesNo(answers.a10)))
  if (answers.a11) items.push(rowItem('Live with a partner as a couple', displayYesNo(answers.a11)))
  if (partner) {
    items.push(rowItem("Partner's name", fullName(partner.name)))
    items.push(rowItem('Lived together continuously for 5 years or more', displayYesNo(partner.livedTogetherFiveYears)))
  }
  items.push(rowItem('Planning to get married', displayYesNo(answers.a13)))
  return { heading: 'Marriage and relationships', items: keepRows(items) }
}

function dependants(answers: WillAnswers): InfoSection {
  const items: InfoItem[] = [rowItem('Children under 18', displayYesNo(answers.f1))]
  answers.minorChildIds.forEach((id) => {
    const person = findPerson(answers, id)
    if (!person) return
    items.push(
      recordItem([
        { label: 'Full name', value: fullName(person.name) },
        { label: 'Date of birth', value: formatDateParts(person.dateOfBirth) },
        { label: 'Relationship', value: relationshipLabel(answers, person) },
      ]),
    )
  })
  items.push(rowItem('Adult child who depends on you because of a disability', displayYesNo(answers.f3)))
  answers.dependantAdultChildIds.forEach((id) => {
    const person = findPerson(answers, id)
    if (!person) return
    items.push(
      recordItem([
        { label: 'Full name', value: fullName(person.name) },
        { label: 'Relationship', value: relationshipLabel(answers, person) },
        { label: 'Support provided', value: (person.supportProvided ?? '').trim() },
      ]),
    )
  })
  items.push(rowItem('Anyone else depends on you for money or care', displayYesNo(answers.f5)))
  answers.otherDependantIds.forEach((id) => {
    const person = findPerson(answers, id)
    if (!person) return
    items.push(
      recordItem([
        { label: 'Full name', value: fullName(person.name) },
        { label: 'Relationship', value: relationshipLabel(answers, person) },
        { label: 'Support provided', value: (person.supportProvided ?? '').trim() },
      ]),
    )
  })
  return { heading: 'Children and people who depend on you', items: keepRows(items) }
}

function legalAdvice(answers: WillAnswers): InfoSection {
  const items: InfoItem[] = []
  ISSUE_ORDER.forEach((code) => {
    const value = (answers.cIssueText[code] ?? '').trim()
    if (value.length > 0) items.push(rowItem(ISSUE_LABELS[code], value))
  })
  if (answers.cJointOtherName) items.push(rowItem("Other person's full legal name", fullName(answers.cJointOtherName)))
  return { heading: 'What you need the will to do', items }
}

function includes(answers: WillAnswers): InfoSection {
  const items: InfoItem[] = answers.cIncludes.map((include) => {
    if (include.recipientType === 'organisation') {
      return recordItem([
        { label: 'Person or organisation', value: 'Organisation' },
        { label: 'Full legal name', value: findOrganisationName(answers, include.orgId) },
        { label: C3_ROLE_LABEL, value: (include.roleText ?? '').trim() },
      ])
    }
    const person = findPerson(answers, include.personId)
    return recordItem([
      { label: 'Person or organisation', value: 'Person' },
      { label: 'Full legal name', value: fullName(person?.name) },
      { label: 'Relationship to you', value: person ? relationshipLabel(answers, person) : '' },
      { label: C3_ROLE_LABEL, value: (include.roleText ?? '').trim() },
    ])
  })
  return { heading: 'People and organisations you want to include', items }
}

function assets(answers: WillAnswers): InfoSection {
  const items: InfoItem[] = answers.cAssets.map((asset) =>
    recordItem([
      { label: 'Type of money or property', value: asset.type },
      { label: 'Description', value: asset.description },
      { label: 'Country', value: asset.country },
    ]),
  )
  return { heading: 'Money and property to discuss', items }
}

export function generateInfoSummary(answers: WillAnswers): InfoSummaryDocument {
  const sections: InfoSection[] = [
    aboutYou(answers),
    marriage(answers),
    dependants(answers),
    legalAdvice(answers),
    includes(answers),
    assets(answers),
  ]

  const other = (answers.cOther ?? '').trim()
  if (other.length > 0) {
    sections.push({ heading: 'Other information', items: [rowItem('Other information', other)] })
  }

  return {
    title: 'Information to take to a lawyer',
    name: fullName(answers.testatorName),
    homeAddress: addressRows(answers.testatorAddress),
    dateCreated: answers.dateCreated ?? '',
    opening: 'This summary organises the information provided in the service. It is not a will.',
    sections,
  }
}
