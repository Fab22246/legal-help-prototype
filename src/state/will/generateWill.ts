import { addressLine, findOrganisationName, findPerson, fullName } from './format'
import { computeReviewPoints } from './routeEngine'
import type { Gift, RemainderBeneficiary, WillAnswers } from './types'

export interface WillClause {
  number: number
  heading: string
  lines: string[]
}

export interface WillDocument {
  title: string
  reviewNotice?: string
  clauses: WillClause[]
  showSignatures: boolean
  signatureStatement?: string
}

function personNameAndAddress(answers: WillAnswers, id: string | undefined): string {
  const person = findPerson(answers, id)
  if (!person) return ''
  const name = fullName(person.name)
  const address = addressLine(person.address)
  return address ? `${name}, of ${address}` : name
}

function joinNamesAndAddresses(answers: WillAnswers, ids: string[]): string {
  const entries = ids.map((id) => personNameAndAddress(answers, id)).filter((entry) => entry.length > 0)
  if (entries.length <= 1) return entries[0] ?? ''
  if (entries.length === 2) return `${entries[0]} and ${entries[1]}`
  return `${entries.slice(0, -1).join('; ')}; and ${entries[entries.length - 1]}`
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

function giftValue(gift: Gift): string {
  if (gift.kind === 'money') {
    return [gift.currency, gift.amount].map((part) => (part ?? '').trim()).filter(Boolean).join(' ')
  }
  return (gift.description ?? '').trim()
}

function giftLines(answers: WillAnswers, gift: Gift, index: number): string[] {
  const value = giftValue(gift)
  const recipient = recipientName(answers, gift.recipientType, gift.recipientPersonId, gift.recipientOrgId)
  const lines: string[] = [`${index}. I give ${value} to ${recipient}.`]

  if (gift.fallback === 'to-estate') {
    lines.push(
      gift.recipientType === 'organisation'
        ? 'If the organisation no longer exists at my death, this gift forms part of the remainder of my estate.'
        : 'If the recipient does not survive me, this gift forms part of the remainder of my estate.',
    )
  } else if (gift.fallback === 'to-replacement') {
    const replacement = recipientName(
      answers,
      gift.replacementType,
      gift.replacementPersonId,
      gift.replacementOrgId,
    )
    lines.push(
      gift.recipientType === 'organisation'
        ? `If the first organisation no longer exists at my death, I give this gift to ${replacement}.`
        : `If the first recipient does not survive me, I give this gift to ${replacement}.`,
    )
  }
  return lines
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

function remainderLines(answers: WillAnswers, beneficiary: RemainderBeneficiary, index: number): string[] {
  const letter = LETTERS[index] ?? `${index + 1}`
  const recipient = recipientName(
    answers,
    beneficiary.recipientType,
    beneficiary.recipientPersonId,
    beneficiary.recipientOrgId,
  )
  const percentage = (beneficiary.percentage ?? '').trim()
  const lines: string[] = [`${letter}. ${percentage}% to ${recipient}.`]

  if (beneficiary.fallback === 'share-among-others') {
    lines.push(
      beneficiary.recipientType === 'organisation'
        ? 'If this organisation no longer exists at my death, divide this share among the other beneficiaries named in this section in proportion to their shares.'
        : 'If this recipient does not survive me, divide this share among the other beneficiaries named in this section in proportion to their shares.',
    )
  } else if (beneficiary.fallback === 'to-children') {
    lines.push('If this person does not survive me, give this share to their children who survive me, in equal shares.')
  } else if (beneficiary.fallback === 'to-replacement') {
    const replacement = recipientName(
      answers,
      beneficiary.replacementType,
      beneficiary.replacementPersonId,
      beneficiary.replacementOrgId,
    )
    lines.push(
      beneficiary.recipientType === 'organisation'
        ? `If the first organisation no longer exists at my death, give this share to ${replacement}.`
        : `If the first recipient does not survive me, give this share to ${replacement}.`,
    )
  }
  return lines
}

// Build the Route A / Route B will document from the answers. routeB adds the
// review notice and omits the signature section.
export function generateWill(answers: WillAnswers, routeB: boolean): WillDocument {
  const name = fullName(answers.testatorName)
  const homeAddress = addressLine(answers.testatorAddress)
  const clauses: WillClause[] = []

  clauses.push({
    number: 1,
    heading: '1. Declaration',
    lines: [`I, ${name}, of ${homeAddress}, declare this document to be my last will.`],
  })

  clauses.push({
    number: 2,
    heading: '2. Earlier wills',
    lines: ['I revoke all wills and codicils I made before this will.'],
  })

  const executorLines: string[] = []
  if (answers.executorIds.length === 1) {
    executorLines.push(`I appoint ${joinNamesAndAddresses(answers, answers.executorIds)} to be the executor of this will.`)
  } else if (answers.executorIds.length > 1) {
    executorLines.push(`I appoint ${joinNamesAndAddresses(answers, answers.executorIds)} to be the executors of this will.`)
  }
  if (answers.replacementExecutorIds.length > 0) {
    executorLines.push(
      `If none of the executors named above can or will act, I appoint ${joinNamesAndAddresses(answers, answers.replacementExecutorIds)} to act instead.`,
    )
  }
  if (executorLines.length > 0) clauses.push({ number: 3, heading: '3. Executors', lines: executorLines })

  if (answers.guardianIds.length > 0) {
    const guardianLines: string[] = [
      `If, at my death, any child of mine is under 18 and no parent can care for that child, I appoint ${joinNamesAndAddresses(answers, answers.guardianIds)} to be the child's guardian.`,
    ]
    if (answers.replacementGuardianIds.length > 0) {
      guardianLines.push(
        `If none of the guardians named above can or will act, I appoint ${joinNamesAndAddresses(answers, answers.replacementGuardianIds)} to act instead.`,
      )
    }
    clauses.push({ number: 4, heading: '4. Guardians', lines: guardianLines })
  }

  clauses.push({
    number: 5,
    heading: '5. Debts and expenses',
    lines: [
      'I direct my executors to pay my legally enforceable debts, funeral expenses and the costs of administering my estate as soon as reasonably practicable.',
    ],
  })

  if (answers.gifts.length > 0) {
    const giftSectionLines: string[] = []
    answers.gifts.forEach((gift, i) => giftSectionLines.push(...giftLines(answers, gift, i + 1)))
    clauses.push({ number: 6, heading: '6. Specific gifts', lines: giftSectionLines })
  }

  if (answers.remainder.length > 0) {
    const remainderSectionLines: string[] = [
      'I give the remainder of my estate, after payment of my debts, expenses and the gifts above, as follows:',
    ]
    answers.remainder.forEach((beneficiary, i) =>
      remainderSectionLines.push(...remainderLines(answers, beneficiary, i)),
    )
    clauses.push({ number: 7, heading: '7. Remainder of the estate', lines: remainderSectionLines })
  }

  const reviewPoints = computeReviewPoints(answers)
  const showMinorClause =
    reviewPoints.includes('MINOR_BENEFICIARY') || reviewPoints.includes('BENEFICIARY_CHILDREN_FALLBACK')
  if (showMinorClause) {
    clauses.push({
      number: 8,
      heading: '8. Gifts to people under 18',
      lines: [
        "Any gift under this will to a person under 18 is to be held by my executors for that person until they reach 18. My executors may use the income or capital for that person's maintenance, education or benefit before then.",
      ],
    })
  }

  const document: WillDocument = {
    title: `LAST WILL AND TESTAMENT OF ${name}`,
    clauses,
    showSignatures: !routeB,
  }
  if (routeB) {
    document.reviewNotice = 'FOR LEGAL REVIEW. DO NOT SIGN.'
  } else {
    document.signatureStatement = `Signed by ${name} as their last will in our presence, both witnesses being present at the same time, and then signed by us in ${name}'s presence.`
  }
  return document
}
