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

export interface InfoRecord {
  rows: InfoRow[]
}

export interface InfoSection {
  heading: string
  rows: InfoRow[]
  records: InfoRecord[]
}

export interface InfoSummaryDocument {
  title: string
  name: string
  homeAddress: InfoRow[]
  dateCreated: string
  opening: string
  sections: InfoSection[]
}

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

function nonEmpty(rows: InfoRow[]): InfoRow[] {
  return rows.filter((row) => row.value.length > 0)
}

function aboutYou(answers: WillAnswers): InfoSection {
  const rows: InfoRow[] = [
    { label: 'Barbados is your main home', value: displayYesNo(answers.a3) },
    { label: 'Citizen of another country', value: displayYesNo(answers.a4) },
    ...answers.a4Countries.map((country) => ({ label: 'Country', value: country })),
    { label: 'Already have a will', value: displayYesNo(answers.a5) },
  ]
  if (answers.a5 === 'yes') rows.push({ label: 'Replace all earlier wills', value: displayYesNo(answers.a6) })
  return { heading: 'About you', rows: nonEmpty(rows), records: [] }
}

function marriage(answers: WillAnswers): InfoSection {
  const spouse = findPerson(answers, answers.spousePersonId)
  const partner = findPerson(answers, answers.partnerPersonId)
  const rows: InfoRow[] = [{ label: 'Currently married', value: displayYesNo(answers.a7) }]
  if (spouse) rows.push({ label: 'Name of the person you are married to', value: fullName(spouse.name) })
  if (answers.a9) rows.push({ label: 'Separated', value: displayYesNo(answers.a9) })
  if (answers.a10) rows.push({ label: 'Lived apart continuously for 5 years or more', value: displayYesNo(answers.a10) })
  if (answers.a11) rows.push({ label: 'Live with a partner as a couple', value: displayYesNo(answers.a11) })
  if (partner) {
    rows.push({ label: "Partner's name", value: fullName(partner.name) })
    rows.push({
      label: 'Lived together continuously for 5 years or more',
      value: displayYesNo(partner.livedTogetherFiveYears),
    })
  }
  rows.push({ label: 'Planning to get married', value: displayYesNo(answers.a13) })
  return { heading: 'Marriage and relationships', rows: nonEmpty(rows), records: [] }
}

function dependants(answers: WillAnswers): InfoSection {
  const rows: InfoRow[] = [{ label: 'Children under 18', value: displayYesNo(answers.f1) }]
  const records: InfoRecord[] = []
  answers.minorChildIds.forEach((id) => {
    const person = findPerson(answers, id)
    if (!person) return
    records.push({
      rows: nonEmpty([
        { label: 'Full name', value: fullName(person.name) },
        { label: 'Date of birth', value: formatDateParts(person.dateOfBirth) },
        { label: 'Relationship', value: relationshipLabel(answers, person) },
      ]),
    })
  })
  rows.push({ label: 'Adult child who depends on you because of a disability', value: displayYesNo(answers.f3) })
  answers.dependantAdultChildIds.forEach((id) => {
    const person = findPerson(answers, id)
    if (!person) return
    records.push({
      rows: nonEmpty([
        { label: 'Full name', value: fullName(person.name) },
        { label: 'Relationship', value: relationshipLabel(answers, person) },
        { label: 'Support provided', value: (person.supportProvided ?? '').trim() },
      ]),
    })
  })
  rows.push({ label: 'Anyone else depends on you for money or care', value: displayYesNo(answers.f5) })
  answers.otherDependantIds.forEach((id) => {
    const person = findPerson(answers, id)
    if (!person) return
    records.push({
      rows: nonEmpty([
        { label: 'Full name', value: fullName(person.name) },
        { label: 'Relationship', value: relationshipLabel(answers, person) },
        { label: 'Support provided', value: (person.supportProvided ?? '').trim() },
      ]),
    })
  })
  return { heading: 'Children and people who depend on you', rows: nonEmpty(rows), records }
}

function legalAdvice(answers: WillAnswers): InfoSection {
  const rows: InfoRow[] = []
  ISSUE_ORDER.forEach((code) => {
    const value = (answers.cIssueText[code] ?? '').trim()
    if (value.length > 0) rows.push({ label: ISSUE_LABELS[code], value })
  })
  if (answers.cJointOtherName) {
    rows.push({ label: "Other person's full legal name", value: fullName(answers.cJointOtherName) })
  }
  return { heading: 'What you need the will to do', rows, records: [] }
}

function includes(answers: WillAnswers): InfoSection {
  const records: InfoRecord[] = []
  answers.cIncludes.forEach((include) => {
    if (include.recipientType === 'organisation') {
      records.push({
        rows: nonEmpty([
          { label: 'Person or organisation', value: 'Organisation' },
          { label: 'Full legal name', value: findOrganisationName(answers, include.orgId) },
          { label: 'What you want them to do or receive', value: (include.roleText ?? '').trim() },
        ]),
      })
    } else {
      const person = findPerson(answers, include.personId)
      records.push({
        rows: nonEmpty([
          { label: 'Person or organisation', value: 'Person' },
          { label: 'Full legal name', value: fullName(person?.name) },
          { label: 'Relationship to you', value: person ? relationshipLabel(answers, person) : '' },
          { label: 'What you want them to do or receive', value: (include.roleText ?? '').trim() },
        ]),
      })
    }
  })
  return { heading: 'People and organisations you want to include', rows: [], records }
}

function assets(answers: WillAnswers): InfoSection {
  const records: InfoRecord[] = answers.cAssets.map((asset) => ({
    rows: nonEmpty([
      { label: 'Type of money or property', value: asset.type },
      { label: 'Description', value: asset.description },
      { label: 'Country', value: asset.country },
    ]),
  }))
  return { heading: 'Money and property to discuss', rows: [], records }
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
    sections.push({ heading: 'Other information', rows: [{ label: 'Other information', value: other }], records: [] })
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
