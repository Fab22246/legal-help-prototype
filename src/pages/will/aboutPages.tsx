import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadioGroup } from '../../components/forms/RadioGroup'
import { TextInput } from '../../components/forms/TextInput'
import type { ErrorSummaryItem } from '../../components/forms/ErrorSummary'
import { WillFormPage } from '../../components/will/WillFormPage'
import { useWillGuard } from '../../components/will/useWillGuard'
import { AddressFields, NameFields, emptyAddress, emptyName } from '../../components/will/fieldGroups'
import type { AddressErrors, NameErrors } from '../../components/will/fieldGroups'
import { proceed } from '../../components/will/nav'
import { useWillState } from '../../state/will/WillState'
import { changeDestination, nextStep } from '../../state/will/journey'
import { computeDerived } from '../../state/will/routeEngine'
import {
  nameError,
  optionalNameError,
  requiredRadioError,
  requiredTextError,
} from '../../state/will/validation'
import type { Address, Name, WillAnswers, WillDerived, YesNoNotSure } from '../../state/will/types'

type Mode = 'forward' | 'change'

function nameItems(prefix: string, errors: NameErrors): ErrorSummaryItem[] {
  const items: ErrorSummaryItem[] = []
  if (errors.firstName) items.push({ fieldId: `${prefix}-first-name`, message: errors.firstName })
  if (errors.middleNames) items.push({ fieldId: `${prefix}-middle-names`, message: errors.middleNames })
  if (errors.lastName) items.push({ fieldId: `${prefix}-last-name`, message: errors.lastName })
  return items
}

function trimmedName(name: Name): Name {
  return {
    firstName: name.firstName.trim(),
    middleNames: (name.middleNames ?? '').trim() || undefined,
    lastName: name.lastName.trim(),
  }
}

function destinationFor(mode: Mode, next: WillAnswers, derived: WillDerived, id: string): string {
  return mode === 'change' ? changeDestination(next, derived) : nextStep(next, derived, id)
}

export function A1Page({ mode }: { mode: Mode }) {
  const active = useWillGuard()
  const { answers, applyAndGet } = useWillState()
  const navigate = useNavigate()
  const [name, setName] = useState<Name>(answers.testatorName ?? emptyName())
  const [errors, setErrors] = useState<NameErrors>({})
  const [attempt, setAttempt] = useState(0)

  if (!active) return null

  function onSubmit() {
    const e: NameErrors = {
      firstName: nameError(name.firstName, 'Enter first name.'),
      lastName: nameError(name.lastName, 'Enter last name.'),
      middleNames: optionalNameError(name.middleNames ?? ''),
    }
    setErrors(e)
    setAttempt((a) => a + 1)
    if (e.firstName || e.lastName || e.middleNames) return
    const next = applyAndGet((d) => {
      d.testatorName = trimmedName(name)
    })
    proceed(navigate, mode, destinationFor(mode, next, computeDerived(next), 'a1'))
  }

  return (
    <WillFormPage
      title="What is your full legal name?"
      mode={mode}
      errorItems={nameItems('a1', errors)}
      submitAttempt={attempt}
      onSubmit={onSubmit}
    >
      <p className="govbb-hint">Enter your name as it appears on official documents.</p>
      <NameFields idPrefix="a1" value={name} onChange={setName} errors={errors} />
    </WillFormPage>
  )
}

export function A2Page({ mode }: { mode: Mode }) {
  const active = useWillGuard()
  const { answers, applyAndGet } = useWillState()
  const navigate = useNavigate()
  const [address, setAddress] = useState<Address>(answers.testatorAddress ?? emptyAddress())
  const [errors, setErrors] = useState<AddressErrors>({})
  const [attempt, setAttempt] = useState(0)

  if (!active) return null

  function onSubmit() {
    const e: AddressErrors = {
      line1: requiredTextError(address.line1, 'Enter address line 1.'),
      townOrCity: requiredTextError(address.townOrCity, 'Enter town or city.'),
      country: requiredTextError(address.country, 'Enter country.'),
    }
    setErrors(e)
    setAttempt((a) => a + 1)
    if (e.line1 || e.townOrCity || e.country) return
    const next = applyAndGet((d) => {
      d.testatorAddress = {
        line1: address.line1.trim(),
        line2: (address.line2 ?? '').trim() || undefined,
        townOrCity: address.townOrCity.trim(),
        parish: (address.parish ?? '').trim() || undefined,
        country: address.country.trim(),
      }
    })
    proceed(navigate, mode, destinationFor(mode, next, computeDerived(next), 'a2'))
  }

  const items: ErrorSummaryItem[] = []
  if (errors.line1) items.push({ fieldId: 'a2-line1', message: errors.line1 })
  if (errors.townOrCity) items.push({ fieldId: 'a2-town', message: errors.townOrCity })
  if (errors.country) items.push({ fieldId: 'a2-country', message: errors.country })

  return (
    <WillFormPage title="What is your home address?" mode={mode} errorItems={items} submitAttempt={attempt} onSubmit={onSubmit}>
      <AddressFields idPrefix="a2" value={address} onChange={setAddress} errors={errors} />
    </WillFormPage>
  )
}

const YNN = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not-sure', label: 'Not sure' },
]

export function A4Page({ mode }: { mode: Mode }) {
  const active = useWillGuard()
  const { answers, applyAndGet } = useWillState()
  const navigate = useNavigate()
  const [value, setValue] = useState<string | undefined>(answers.a4)
  const [countries, setCountries] = useState<string[]>(
    answers.a4Countries.length > 0 ? [...answers.a4Countries] : [''],
  )
  const [radioError, setRadioError] = useState<string | undefined>()
  const [countryError, setCountryError] = useState<string | undefined>()
  const [attempt, setAttempt] = useState(0)

  if (!active) return null

  function onSubmit() {
    let re: string | undefined
    let ce: string | undefined
    if (!value) re = requiredRadioError('Are you a citizen of a country other than Barbados?')
    const cleaned = countries.map((c) => c.trim()).filter((c) => c.length > 0)
    if (value === 'yes' && cleaned.length === 0) ce = 'Add at least one country of citizenship.'
    setRadioError(re)
    setCountryError(ce)
    setAttempt((a) => a + 1)
    if (re || ce) return
    const next = applyAndGet((d) => {
      d.a4 = value as YesNoNotSure
      d.a4Countries = value === 'yes' ? cleaned : []
    })
    proceed(navigate, mode, destinationFor(mode, next, computeDerived(next), 'a4'))
  }

  const items: ErrorSummaryItem[] = []
  if (radioError) items.push({ fieldId: 'a4-yes', message: radioError })
  if (countryError) items.push({ fieldId: 'a4-country-0', message: countryError })

  return (
    <WillFormPage
      title="Are you a citizen of a country other than Barbados?"
      mode={mode}
      errorItems={items}
      submitAttempt={attempt}
      onSubmit={onSubmit}
    >
      <RadioGroup
        name="a4"
        legend="Are you a citizen of a country other than Barbados?"
        legendVisuallyHidden
        options={YNN}
        value={value}
        onChange={setValue}
        error={radioError}
      />
      {value === 'yes' ? (
        <>
          {countries.map((country, index) => (
            <div key={index}>
              <TextInput
                id={`a4-country-${index}`}
                label="Country"
                value={country}
                onChange={(v) => setCountries((list) => list.map((c, i) => (i === index ? v : c)))}
                error={index === 0 ? countryError : undefined}
              />
              {countries.length > 1 ? (
                <button
                  type="button"
                  className="govbb-btn--link"
                  onClick={() => setCountries((list) => list.filter((_, i) => i !== index))}
                >
                  Remove country
                </button>
              ) : null}
            </div>
          ))}
          <button type="button" className="govbb-btn--secondary" onClick={() => setCountries((list) => [...list, ''])}>
            Add another country
          </button>
        </>
      ) : null}
    </WillFormPage>
  )
}

export function A8Page({ mode }: { mode: Mode }) {
  const active = useWillGuard()
  const { answers, applyAndGet, newId } = useWillState()
  const navigate = useNavigate()
  const idRef = useRef(answers.spousePersonId ?? newId())
  const existing = answers.people.find((p) => p.id === answers.spousePersonId)
  const [name, setName] = useState<Name>(existing?.name ?? emptyName())
  const [errors, setErrors] = useState<NameErrors>({})
  const [attempt, setAttempt] = useState(0)

  if (!active) return null

  function onSubmit() {
    const e: NameErrors = {
      firstName: nameError(name.firstName, 'Enter first name.'),
      lastName: nameError(name.lastName, 'Enter last name.'),
      middleNames: optionalNameError(name.middleNames ?? ''),
    }
    setErrors(e)
    setAttempt((a) => a + 1)
    if (e.firstName || e.lastName || e.middleNames) return
    const id = idRef.current
    const next = applyAndGet((d) => {
      const record = { id, name: trimmedName(name) }
      const found = d.people.some((p) => p.id === id)
      d.people = found ? d.people.map((p) => (p.id === id ? { ...p, name: trimmedName(name) } : p)) : [...d.people, record]
      d.spousePersonId = id
    })
    proceed(navigate, mode, destinationFor(mode, next, computeDerived(next), 'a8'))
  }

  return (
    <WillFormPage
      title="What is the full legal name of the person you are married to?"
      mode={mode}
      errorItems={nameItems('a8', errors)}
      submitAttempt={attempt}
      onSubmit={onSubmit}
    >
      <NameFields idPrefix="a8" value={name} onChange={setName} errors={errors} />
    </WillFormPage>
  )
}

export function A12Page({ mode }: { mode: Mode }) {
  const active = useWillGuard()
  const { answers, applyAndGet, newId } = useWillState()
  const navigate = useNavigate()
  const idRef = useRef(answers.partnerPersonId ?? newId())
  const existing = answers.people.find((p) => p.id === answers.partnerPersonId)
  const [name, setName] = useState<Name>(existing?.name ?? emptyName())
  const [length, setLength] = useState<string | undefined>(existing?.livedTogetherFiveYears)
  const [errors, setErrors] = useState<NameErrors>({})
  const [attempt, setAttempt] = useState(0)

  if (!active) return null

  function onSubmit() {
    const e: NameErrors = {
      firstName: nameError(name.firstName, 'Enter first name.'),
      lastName: nameError(name.lastName, 'Enter last name.'),
      middleNames: optionalNameError(name.middleNames ?? ''),
    }
    setErrors(e)
    setAttempt((a) => a + 1)
    if (e.firstName || e.lastName || e.middleNames) return
    const id = idRef.current
    const lengthValue = length as YesNoNotSure | undefined
    const next = applyAndGet((d) => {
      const found = d.people.some((p) => p.id === id)
      d.people = found
        ? d.people.map((p) => (p.id === id ? { ...p, name: trimmedName(name), livedTogetherFiveYears: lengthValue } : p))
        : [...d.people, { id, name: trimmedName(name), livedTogetherFiveYears: lengthValue }]
      d.partnerPersonId = id
    })
    proceed(navigate, mode, destinationFor(mode, next, computeDerived(next), 'a12'))
  }

  return (
    <WillFormPage
      title="Tell us about your partner"
      mode={mode}
      errorItems={nameItems('a12', errors)}
      submitAttempt={attempt}
      onSubmit={onSubmit}
    >
      <NameFields idPrefix="a12" value={name} onChange={setName} errors={errors} />
      <RadioGroup
        name="a12-length"
        legend="Have you lived together continuously for 5 years or more?"
        options={YNN}
        value={length}
        onChange={setLength}
      />
    </WillFormPage>
  )
}
