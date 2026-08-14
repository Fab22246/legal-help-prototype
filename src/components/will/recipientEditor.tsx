import { RadioGroup } from '../forms/RadioGroup'
import { TextInput } from '../forms/TextInput'
import { DateInput } from '../forms/DateInput'
import { NameFields, emptyName } from './fieldGroups'
import type { NameErrors } from './fieldGroups'
import {
  dobError,
  nameError,
  optionalNameError,
  orgNameMissingError,
  requiredRadioError,
  requiredTextError,
} from '../../state/will/validation'
import { personOptionLabel } from '../../state/will/journey'
import { findOrganisationName } from '../../state/will/format'
import type { DateParts, Name, RecipientType, WillAnswers, YesNoNotSure } from '../../state/will/types'

export interface RecipientValue {
  type?: RecipientType
  personChoice?: string // existing person id or 'new'
  name: Name
  relationship: string
  under18?: YesNoNotSure
  dob: DateParts
  orgChoice?: string // existing org id or 'new-org'
  orgName: string
  // The organisation address is a single optional value.
  orgAddress: string
}

export interface RecipientErrors {
  type?: string
  personChoice?: string
  firstName?: string
  middleNames?: string
  lastName?: string
  relationship?: string
  under18?: string
  dob?: string
  orgChoice?: string
  orgName?: string
}

export function emptyRecipient(): RecipientValue {
  return { name: emptyName(), relationship: '', dob: { day: '', month: '', year: '' }, orgName: '', orgAddress: '' }
}

export function recipientFromRefs(
  answers: WillAnswers,
  type: RecipientType | undefined,
  personId: string | undefined,
  orgId: string | undefined,
): RecipientValue {
  const value = emptyRecipient()
  value.type = type
  if (type === 'person' && personId) {
    const person = answers.people.find((p) => p.id === personId)
    value.personChoice = personId
    value.name = person?.name ?? emptyName()
    value.relationship = person?.relationship ?? ''
    value.under18 = person?.under18Answer
    value.dob = person?.dateOfBirth ?? { day: '', month: '', year: '' }
  }
  if (type === 'organisation' && orgId) {
    value.orgChoice = orgId
    value.orgName = findOrganisationName(answers, orgId)
    const org = answers.organisations.find((o) => o.id === orgId)
    value.orgAddress = org?.address?.line1 ?? ''
  }
  return value
}

// Whether the under-18 question must be asked for the chosen person.
export function under18Asked(answers: WillAnswers, value: RecipientValue): boolean {
  if (value.type !== 'person') return false
  if (!value.personChoice) return false
  if (value.personChoice === 'new') return true
  const id = value.personChoice
  if (answers.minorChildIds.includes(id)) return false
  if (answers.dependantAdultChildIds.includes(id)) return false
  const person = answers.people.find((p) => p.id === id)
  if (person?.dateOfBirth && (person.dateOfBirth.day || person.dateOfBirth.month || person.dateOfBirth.year)) return false
  return true
}

function isNewPerson(value: RecipientValue): boolean {
  return value.type === 'person' && value.personChoice === 'new'
}

// Validate the recipient. `question` is the owning page's recipient question, so
// the required-answer error follows the specification exactly.
export function validateRecipient(answers: WillAnswers, value: RecipientValue, question: string): RecipientErrors {
  const errors: RecipientErrors = {}
  if (!value.type) {
    errors.type = requiredRadioError(question)
    return errors
  }
  if (value.type === 'person') {
    if (!value.personChoice) {
      errors.personChoice = requiredRadioError(question)
      return errors
    }
    if (isNewPerson(value)) {
      errors.firstName = nameError(value.name.firstName, 'Enter first name.')
      errors.lastName = nameError(value.name.lastName, 'Enter last name.')
      errors.middleNames = optionalNameError(value.name.middleNames ?? '')
      errors.relationship = requiredTextError(value.relationship, 'Enter relationship to you.')
    }
    if (under18Asked(answers, value)) {
      if (!value.under18) errors.under18 = requiredRadioError('Is this person under 18?')
      else if (value.under18 === 'yes') {
        errors.dob = dobError(value.dob, { underMessage: 'Enter a date of birth that makes the person under 18.' })
      }
    }
  } else {
    if (!value.orgChoice) {
      errors.orgChoice = requiredRadioError(question)
      return errors
    }
    if (value.orgChoice === 'new-org') {
      errors.orgName = value.orgName.trim().length === 0 ? orgNameMissingError : undefined
    }
  }
  return errors
}

export function recipientHasError(errors: RecipientErrors): boolean {
  return Object.values(errors).some(Boolean)
}

function trimmedName(name: Name): Name {
  return {
    firstName: name.firstName.trim(),
    middleNames: (name.middleNames ?? '').trim() || undefined,
    lastName: name.lastName.trim(),
  }
}

// Create or reuse the referenced person or organisation on the draft and return
// the stored reference fields.
export function commitRecipient(
  draft: WillAnswers,
  answers: WillAnswers,
  value: RecipientValue,
  newId: () => string,
): { type: RecipientType; personId?: string; orgId?: string } {
  if (value.type === 'organisation') {
    if (value.orgChoice === 'new-org') {
      const id = newId()
      const addressText = value.orgAddress.trim()
      const address = addressText ? { line1: addressText, townOrCity: '', country: '' } : undefined
      draft.organisations = [...draft.organisations, { id, legalName: value.orgName.trim(), address }]
      return { type: 'organisation', orgId: id }
    }
    return { type: 'organisation', orgId: value.orgChoice }
  }

  const asked = under18Asked(answers, value)
  if (value.personChoice === 'new') {
    const id = newId()
    const record = {
      id,
      name: trimmedName(value.name),
      relationship: value.relationship.trim(),
      under18Answer: asked ? value.under18 : undefined,
      dateOfBirth: asked && value.under18 === 'yes' ? value.dob : undefined,
    }
    draft.people = [...draft.people, record]
    return { type: 'person', personId: id }
  }

  const id = value.personChoice as string
  if (asked) {
    draft.people = draft.people.map((p) =>
      p.id === id
        ? { ...p, under18Answer: value.under18, dateOfBirth: value.under18 === 'yes' ? value.dob : p.dateOfBirth }
        : p,
    )
  }
  return { type: 'person', personId: id }
}

// Renders the recipient controls. `question` is the recipient question used for
// the type radio and the person and organisation selections.
export function RecipientFields({
  prefix,
  question,
  answers,
  value,
  onChange,
  errors,
}: {
  prefix: string
  question: string
  answers: WillAnswers
  value: RecipientValue
  onChange: (value: RecipientValue) => void
  errors: RecipientErrors
}) {
  const personOptions = [
    ...answers.people.map((p) => ({ value: p.id, label: personOptionLabel(answers, p.id) })),
    { value: 'new', label: 'Someone else' },
  ]
  const orgOptions = [
    ...answers.organisations.map((o) => ({ value: o.id, label: findOrganisationName(answers, o.id) })),
    { value: 'new-org', label: 'Another organisation' },
  ]
  const nameErrors: NameErrors = { firstName: errors.firstName, middleNames: errors.middleNames, lastName: errors.lastName }

  return (
    <>
      <RadioGroup
        name={`${prefix}-type`}
        legend={question}
        options={[
          { value: 'person', label: 'A person' },
          { value: 'organisation', label: 'An organisation' },
        ]}
        value={value.type}
        onChange={(v) => onChange({ ...value, type: v as RecipientType })}
        error={errors.type}
      />

      {value.type === 'person' ? (
        <>
          <RadioGroup
            name={`${prefix}-person`}
            legend={question}
            options={personOptions}
            value={value.personChoice}
            onChange={(v) => onChange({ ...value, personChoice: v })}
            error={errors.personChoice}
          />
          {value.personChoice === 'new' ? (
            <>
              <NameFields
                idPrefix={`${prefix}-person`}
                value={value.name}
                onChange={(name) => onChange({ ...value, name })}
                errors={nameErrors}
              />
              <TextInput
                id={`${prefix}-person-relationship`}
                label="Relationship to you"
                value={value.relationship}
                onChange={(v) => onChange({ ...value, relationship: v })}
                error={errors.relationship}
              />
            </>
          ) : null}
          {under18Asked(answers, value) ? (
            <>
              <RadioGroup
                name={`${prefix}-under18`}
                legend="Is this person under 18?"
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'not-sure', label: 'Not sure' },
                ]}
                value={value.under18}
                onChange={(v) => onChange({ ...value, under18: v as YesNoNotSure })}
                error={errors.under18}
              />
              {value.under18 === 'yes' ? (
                <DateInput
                  namePrefix={`${prefix}-dob`}
                  legend="Date of birth"
                  value={value.dob}
                  onChange={(dob: DateParts) => onChange({ ...value, dob })}
                  error={errors.dob}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {value.type === 'organisation' ? (
        <>
          <RadioGroup
            name={`${prefix}-org`}
            legend={question}
            options={orgOptions}
            value={value.orgChoice}
            onChange={(v) => onChange({ ...value, orgChoice: v })}
            error={errors.orgChoice}
          />
          {value.orgChoice === 'new-org' ? (
            <>
              <TextInput
                id={`${prefix}-org-name`}
                label="Full legal name of organisation"
                value={value.orgName}
                onChange={(v) => onChange({ ...value, orgName: v })}
                error={errors.orgName}
              />
              <TextInput
                id={`${prefix}-org-address`}
                label="Address"
                optional
                value={value.orgAddress}
                onChange={(v) => onChange({ ...value, orgAddress: v })}
              />
            </>
          ) : null}
        </>
      ) : null}
    </>
  )
}

// Error-summary items for a recipient block, in field order.
export function recipientErrorItems(prefix: string, errors: RecipientErrors): { fieldId: string; message: string }[] {
  const items: { fieldId: string; message: string }[] = []
  if (errors.type) items.push({ fieldId: `${prefix}-type-person`, message: errors.type })
  if (errors.personChoice) items.push({ fieldId: `${prefix}-person-new`, message: errors.personChoice })
  if (errors.firstName) items.push({ fieldId: `${prefix}-person-first-name`, message: errors.firstName })
  if (errors.middleNames) items.push({ fieldId: `${prefix}-person-middle-names`, message: errors.middleNames })
  if (errors.lastName) items.push({ fieldId: `${prefix}-person-last-name`, message: errors.lastName })
  if (errors.relationship) items.push({ fieldId: `${prefix}-person-relationship`, message: errors.relationship })
  if (errors.under18) items.push({ fieldId: `${prefix}-under18-yes`, message: errors.under18 })
  if (errors.dob) items.push({ fieldId: `${prefix}-dob-day`, message: errors.dob })
  if (errors.orgChoice) items.push({ fieldId: `${prefix}-org-new-org`, message: errors.orgChoice })
  if (errors.orgName) items.push({ fieldId: `${prefix}-org-name`, message: errors.orgName })
  return items
}
