import {
  displayYesNo,
  findOrganisationName,
  findPerson,
  formatDateParts,
  fullName,
  relationshipLabel,
} from './format'
import { computeReviewPoints, personIsUnderOrMaybe } from './routeEngine'
import type { ReviewPoint, WillAnswers } from './types'

export interface SummaryDetail {
  label: string
  value: string
}

export interface ReviewSection {
  heading: string
  text: string
  details: SummaryDetail[]
}

export interface ReviewSummaryDocument {
  title: string
  name: string
  dateCreated: string
  opening: string
  sections: ReviewSection[]
  closing: string
}

const HEADINGS: Record<ReviewPoint, { heading: string; text: string }> = {
  FOREIGN_ASSETS: {
    heading: 'Money or property outside Barbados',
    text: 'Ask how the laws of each country affect the will and the money or property held there.',
  },
  MAIN_HOME_OUTSIDE_BARBADOS: {
    heading: 'Main home outside Barbados',
    text: 'Ask which country’s law should apply to the will.',
  },
  OTHER_CITIZENSHIP: {
    heading: 'Citizenship of another country',
    text: 'Ask whether citizenship in another country affects the will.',
  },
  CURRENT_MARRIAGE: {
    heading: 'Current marriage',
    text: 'Ask how the rights of the person you are married to affect the gifts in the will.',
  },
  MARRIED_SEPARATED: {
    heading: 'Separation',
    text: 'Ask how the separation and the length of time living apart affect the will.',
  },
  UNMARRIED_PARTNER: {
    heading: 'Partner',
    text: 'Ask whether the relationship gives your partner rights that affect the will.',
  },
  PLANNED_MARRIAGE: {
    heading: 'Planned marriage',
    text: 'Ask what will happen to the will if you marry after making it.',
  },
  MINOR_CHILD: {
    heading: 'Child under 18',
    text: 'Ask whether the will makes suitable provision for each child and whether the guardian wording is appropriate.',
  },
  DEPENDANT_ADULT_CHILD: {
    heading: 'Adult child who depends on you',
    text: 'Ask whether the will makes suitable provision for this child.',
  },
  OTHER_DEPENDANT: {
    heading: 'Other person who depends on you',
    text: 'Ask whether this person’s circumstances affect the will.',
  },
  JOINTLY_OWNED_ASSET: {
    heading: 'Jointly owned money or property',
    text: 'Ask whether each jointly owned item can pass under the will.',
  },
  BUSINESS_OWNERSHIP: {
    heading: 'Business ownership',
    text: 'Ask whether the will needs any additional wording about the business.',
  },
  SPECIFIC_GIFT_OF_LAND: {
    heading: 'Gift of land or a home',
    text: 'Ask whether the description and ownership of the property are sufficient for the gift.',
  },
  MINOR_BENEFICIARY: {
    heading: 'Beneficiary under 18',
    text: 'Ask whether the age and trust wording are suitable for this beneficiary.',
  },
  BENEFICIARY_CHILDREN_FALLBACK: {
    heading: 'Gift to a beneficiary’s children',
    text: 'Ask whether the fallback gift clearly covers the intended children and shares, including if any child is under 18.',
  },
  FAMILY_OR_DEPENDANT_NOT_INCLUDED: {
    heading: 'Family member or dependant receives nothing',
    text: 'Ask how the person’s rights or needs may affect the gifts in the will.',
  },
}

// Order sections in the spec's table order.
const ORDER: ReviewPoint[] = [
  'FOREIGN_ASSETS',
  'MAIN_HOME_OUTSIDE_BARBADOS',
  'OTHER_CITIZENSHIP',
  'CURRENT_MARRIAGE',
  'MARRIED_SEPARATED',
  'UNMARRIED_PARTNER',
  'PLANNED_MARRIAGE',
  'MINOR_CHILD',
  'DEPENDANT_ADULT_CHILD',
  'OTHER_DEPENDANT',
  'JOINTLY_OWNED_ASSET',
  'BUSINESS_OWNERSHIP',
  'SPECIFIC_GIFT_OF_LAND',
  'MINOR_BENEFICIARY',
  'BENEFICIARY_CHILDREN_FALLBACK',
  'FAMILY_OR_DEPENDANT_NOT_INCLUDED',
]

function recipientName(
  answers: WillAnswers,
  type: 'person' | 'organisation' | undefined,
  personId: string | undefined,
  orgId: string | undefined,
): string {
  if (type === 'organisation') return findOrganisationName(answers, orgId)
  return fullName(findPerson(answers, personId)?.name)
}

function under18Info(answers: WillAnswers, id: string | undefined): string {
  if (!id) return ''
  if (answers.minorChildIds.includes(id)) return 'Under 18'
  const person = findPerson(answers, id)
  if (person?.under18Answer === 'yes') return 'Under 18'
  if (person?.under18Answer === 'not-sure') return 'May be under 18'
  const dob = formatDateParts(person?.dateOfBirth)
  return dob ? `Date of birth ${dob}` : ''
}

function detailsFor(answers: WillAnswers, code: ReviewPoint): SummaryDetail[] {
  const rows: SummaryDetail[] = []
  const spouse = findPerson(answers, answers.spousePersonId)
  const partner = findPerson(answers, answers.partnerPersonId)

  switch (code) {
    case 'FOREIGN_ASSETS':
      rows.push({ label: 'Money or property outside Barbados', value: displayYesNo(answers.s6) })
      break
    case 'MAIN_HOME_OUTSIDE_BARBADOS':
      rows.push({ label: 'Barbados is your main home', value: displayYesNo(answers.a3) })
      break
    case 'OTHER_CITIZENSHIP':
      rows.push({ label: 'Citizen of another country', value: displayYesNo(answers.a4) })
      answers.a4Countries.forEach((country) => rows.push({ label: 'Country', value: country }))
      break
    case 'CURRENT_MARRIAGE':
      rows.push({ label: 'Currently married', value: displayYesNo(answers.a7) })
      if (spouse) rows.push({ label: 'Name of the person you are married to', value: fullName(spouse.name) })
      break
    case 'MARRIED_SEPARATED':
      if (spouse) rows.push({ label: 'Name of the person you are married to', value: fullName(spouse.name) })
      rows.push({ label: 'Separated', value: displayYesNo(answers.a9) })
      rows.push({ label: 'Lived apart continuously for 5 years or more', value: displayYesNo(answers.a10) })
      break
    case 'UNMARRIED_PARTNER':
      if (partner) rows.push({ label: 'Partner', value: fullName(partner.name) })
      rows.push({
        label: 'Lived together continuously for 5 years or more',
        value: displayYesNo(partner?.livedTogetherFiveYears),
      })
      break
    case 'PLANNED_MARRIAGE':
      rows.push({ label: 'Planning to get married', value: displayYesNo(answers.a13) })
      break
    case 'MINOR_CHILD':
      answers.minorChildIds.forEach((id) => {
        const person = findPerson(answers, id)
        if (!person) return
        rows.push({ label: 'Child', value: fullName(person.name) })
        rows.push({ label: 'Date of birth', value: formatDateParts(person.dateOfBirth) })
        rows.push({ label: 'Relationship', value: relationshipLabel(answers, person) })
      })
      break
    case 'DEPENDANT_ADULT_CHILD':
      answers.dependantAdultChildIds.forEach((id) => {
        const person = findPerson(answers, id)
        if (!person) return
        rows.push({ label: 'Child', value: fullName(person.name) })
        rows.push({ label: 'Relationship', value: relationshipLabel(answers, person) })
        rows.push({ label: 'Support provided', value: (person.supportProvided ?? '').trim() })
      })
      break
    case 'OTHER_DEPENDANT':
      answers.otherDependantIds.forEach((id) => {
        const person = findPerson(answers, id)
        if (!person) return
        rows.push({ label: 'Person', value: fullName(person.name) })
        rows.push({ label: 'Relationship', value: relationshipLabel(answers, person) })
        rows.push({ label: 'Support provided', value: (person.supportProvided ?? '').trim() })
      })
      break
    case 'JOINTLY_OWNED_ASSET':
      rows.push({ label: 'Own money or property with someone else', value: displayYesNo(answers.p1) })
      answers.jointAssets.forEach((asset) => rows.push({ label: 'Description', value: asset.description }))
      break
    case 'BUSINESS_OWNERSHIP':
      rows.push({ label: 'Own a business or part of a business', value: displayYesNo(answers.p3) })
      if (answers.p4) rows.push({ label: 'Want the will to decide who will own or run the business', value: displayYesNo(answers.p4) })
      break
    case 'SPECIFIC_GIFT_OF_LAND':
      answers.gifts
        .filter((gift) => gift.kind === 'land')
        .forEach((gift) => {
          rows.push({ label: 'Gift', value: (gift.description ?? '').trim() })
          rows.push({
            label: 'Recipient',
            value: recipientName(answers, gift.recipientType, gift.recipientPersonId, gift.recipientOrgId),
          })
        })
      break
    case 'MINOR_BENEFICIARY':
      answers.gifts.forEach((gift) => {
        ;[gift.recipientPersonId, gift.replacementPersonId].forEach((id) => {
          if (personIsUnderOrMaybe(answers, id)) {
            rows.push({ label: 'Beneficiary under 18', value: fullName(findPerson(answers, id)?.name) })
            rows.push({ label: 'Age information', value: under18Info(answers, id) })
          }
        })
      })
      answers.remainder.forEach((beneficiary) => {
        ;[beneficiary.recipientPersonId, beneficiary.replacementPersonId].forEach((id) => {
          if (personIsUnderOrMaybe(answers, id)) {
            rows.push({ label: 'Beneficiary under 18', value: fullName(findPerson(answers, id)?.name) })
            rows.push({ label: 'Age information', value: under18Info(answers, id) })
          }
        })
      })
      break
    case 'BENEFICIARY_CHILDREN_FALLBACK':
      answers.remainder
        .filter((beneficiary) => beneficiary.fallback === 'to-children')
        .forEach((beneficiary) => {
          rows.push({
            label: 'Beneficiary',
            value: recipientName(
              answers,
              beneficiary.recipientType,
              beneficiary.recipientPersonId,
              beneficiary.recipientOrgId,
            ),
          })
          rows.push({ label: 'Percentage', value: `${(beneficiary.percentage ?? '').trim()}%` })
          rows.push({ label: 'What happens if the person dies before you', value: 'Give it to their children in equal shares' })
        })
      break
    case 'FAMILY_OR_DEPENDANT_NOT_INCLUDED': {
      const ids = [
        answers.spousePersonId,
        answers.partnerPersonId,
        ...answers.minorChildIds,
        ...answers.dependantAdultChildIds,
        ...answers.otherDependantIds,
      ].filter((id): id is string => Boolean(id))
      const primaries = new Set<string>()
      answers.gifts.forEach((gift) => {
        if (gift.recipientType === 'person' && gift.recipientPersonId) primaries.add(gift.recipientPersonId)
      })
      answers.remainder.forEach((beneficiary) => {
        if (beneficiary.recipientType === 'person' && beneficiary.recipientPersonId) {
          primaries.add(beneficiary.recipientPersonId)
        }
      })
      ids
        .filter((id) => !primaries.has(id))
        .forEach((id) => {
          const person = findPerson(answers, id)
          if (!person) return
          rows.push({ label: 'Name', value: fullName(person.name) })
          rows.push({ label: 'Relationship', value: relationshipLabel(answers, person) })
        })
      break
    }
  }
  return rows.filter((row) => row.value.length > 0)
}

export function generateReviewSummary(answers: WillAnswers): ReviewSummaryDocument {
  const active = new Set<ReviewPoint>(computeReviewPoints(answers))
  const sections: ReviewSection[] = ORDER.filter((code) => active.has(code)).map((code) => ({
    heading: HEADINGS[code].heading,
    text: HEADINGS[code].text,
    details: detailsFor(answers, code),
  }))

  return {
    title: 'Points for a lawyer to review',
    name: fullName(answers.testatorName),
    dateCreated: answers.dateCreated ?? '',
    opening:
      'This summary is based on the answers provided in the service. Review these points together with the will. Do not sign the will until a lawyer has checked it.',
    sections,
    closing: 'Do not sign the will until a lawyer has reviewed it and you have made any changes they recommend.',
  }
}
