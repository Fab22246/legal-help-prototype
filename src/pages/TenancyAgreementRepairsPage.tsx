import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { RadioGroup } from '../components/forms/RadioGroup'
import { TextInput } from '../components/forms/TextInput'
import { TextArea } from '../components/forms/TextArea'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { InsetText } from '../components/tenancy/InsetText'
import { useStageGate } from '../components/tenancy/useStageGate'
import { partyDisplayName } from '../components/tenancy/partyDisplayName'
import {
  useTenancyBuilder,
  type PartyRef,
  type RepairsStage,
  type YesNotYet,
} from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'

type View = 'form' | 'confirm-wording' | 'confirm-contact'

interface Errors {
  agreed?: string
  arrangements?: string
  contact?: string
  otherName?: string
  instructions?: string
}

const AGREED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'not-yet', label: 'Not yet' },
]

export function TenancyAgreementRepairsPage() {
  const navigate = useNavigate()
  const { state, saveRepairs } = useTenancyBuilder()
  const gate = useStageGate('repairs')

  const landlords = state.landlords ?? []
  const hasAgent = state.agent?.hasAgent === 'yes'
  const agentName = state.agent?.details
    ? partyDisplayName(state.agent.details, 'the agent')
    : 'the agent'

  const savedContact = state.repairs?.contact
  const [agreed, setAgreed] = useState<YesNotYet | undefined>(state.repairs?.agreed)
  const [arrangements, setArrangements] = useState(state.repairs?.arrangements ?? '')
  const [contactValue, setContactValue] = useState<string | undefined>(() => {
    if (!savedContact) return undefined
    if (savedContact.kind === 'landlord') return `landlord:${savedContact.landlordId}`
    if (savedContact.kind === 'agent') return 'agent'
    return 'other'
  })
  const [otherName, setOtherName] = useState(
    savedContact?.kind === 'other' ? (savedContact.name ?? '') : '',
  )
  const [instructions, setInstructions] = useState(state.repairs?.contactInstructions ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)
  const [focusInstructions, setFocusInstructions] = useState(false)
  const [view, setView] = useState<View>('form')
  // A contact change that needs confirmation is held here until confirmed.
  const [pendingContact, setPendingContact] = useState<string | undefined>(undefined)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [view])

  useEffect(() => {
    if (focusErrorSummary) {
      errorSummaryRef.current?.focus()
      setFocusErrorSummary(false)
    }
  }, [focusErrorSummary])

  useEffect(() => {
    if (focusInstructions) {
      document.getElementById('repairs-contact-instructions')?.focus()
      setFocusInstructions(false)
    }
  }, [focusInstructions])

  const contactOptions = [
    ...landlords.map((l) => ({
      value: `landlord:${l.id}`,
      label: partyDisplayName(l, 'this landlord'),
    })),
    ...(hasAgent ? [{ value: 'agent', label: `The agent, ${agentName}` }] : []),
    { value: 'other', label: 'Someone else' },
  ]
  const firstContactId = `repairs-contact-${contactOptions[0].value}`

  const contactName = (() => {
    if (contactValue === 'agent') return agentName
    if (contactValue === 'other') return otherName.trim() || 'the repair contact'
    if (contactValue?.startsWith('landlord:')) {
      const id = contactValue.slice('landlord:'.length)
      const l = landlords.find((x) => x.id === id)
      return l ? partyDisplayName(l, 'this landlord') : 'the repair contact'
    }
    return 'the repair contact'
  })()

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.agreed) items.push({ fieldId: 'repairs-agreed-yes', message: errors.agreed })
    if (errors.arrangements)
      items.push({ fieldId: 'repairs-arrangements', message: errors.arrangements })
    if (errors.contact) items.push({ fieldId: firstContactId, message: errors.contact })
    if (errors.otherName)
      items.push({ fieldId: 'repairs-contact-other-name', message: errors.otherName })
    if (errors.instructions)
      items.push({ fieldId: 'repairs-contact-instructions', message: errors.instructions })
    return items
  }, [errors, firstContactId])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function handleAgreedChange(value: string) {
    const next = value as YesNotYet
    // Switching a saved/typed Yes to Not yet while wording exists is confirmed
    // first so the user does not lose what they entered by accident.
    if (next === 'not-yet' && arrangements.trim()) {
      setView('confirm-wording')
      return
    }
    setAgreed(next)
  }

  function handleContactChange(value: string) {
    if (value === contactValue) return
    // Changing the contact while instructions exist is confirmed first, because
    // the instructions describe how to reach the current contact.
    if (instructions.trim()) {
      setPendingContact(value)
      setView('confirm-contact')
      return
    }
    setContactValue(value)
    if (value !== 'other') setOtherName('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}

    if (!agreed) {
      next.agreed = 'Select whether everyone has agreed who will arrange and pay for repairs.'
    } else if (agreed === 'yes' && !arrangements.trim()) {
      next.arrangements = 'Enter what has been agreed about repairs.'
    }

    if (!contactValue) {
      next.contact = 'Select who the tenant should contact first about a repair.'
    } else {
      if (contactValue === 'other' && !otherName.trim()) {
        next.otherName = 'Enter the name of the person or organisation.'
      }
      if (!instructions.trim()) {
        next.instructions = 'Enter how the tenant should contact the repair contact.'
      }
    }

    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }

    let contact: PartyRef
    if (contactValue === 'agent') {
      contact = { kind: 'agent' }
    } else if (contactValue === 'other') {
      contact = { kind: 'other', name: otherName.trim() }
    } else {
      contact = { kind: 'landlord', landlordId: (contactValue as string).slice('landlord:'.length) }
    }
    const repairs: RepairsStage = { agreed: agreed as YesNotYet, contact, contactInstructions: instructions.trim() }
    if (agreed === 'yes') repairs.arrangements = arrangements.trim()
    saveRepairs(repairs)
    navigate('/renting-home/agreement/access')
  }

  if (view === 'confirm-wording') {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Delete what you entered about repairs?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Changing this answer will delete what you entered about repairs. Your other answers will
          not be affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              setAgreed('not-yet')
              setArrangements('')
              setView('form')
            }}
          >
            Delete repair information
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => setView('form')}
          >
            Cancel
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  if (view === 'confirm-contact') {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Change the repair contact?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Changing the repair contact will delete the contact details you entered for the current
          contact. Your other answers will not be affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              const value = pendingContact
              setContactValue(value)
              setInstructions('')
              if (value !== 'other') setOtherName('')
              setPendingContact(undefined)
              setView('form')
              setFocusInstructions(true)
            }}
          >
            Change repair contact
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              setPendingContact(undefined)
              setView('form')
            }}
          >
            Cancel
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement/included-items">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Repairs
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <RadioGroup
          name="repairs-agreed"
          legend="Have all landlords and tenants agreed who will arrange and pay for repairs?"
          options={AGREED_OPTIONS}
          value={agreed}
          onChange={handleAgreedChange}
          error={errors.agreed}
        />
        {agreed === 'yes' ? (
          <TextArea
            id="repairs-arrangements"
            label="What have they agreed about repairs?"
            hint="Describe which repairs the landlord will handle and which the tenant will handle."
            value={arrangements}
            onChange={setArrangements}
            error={errors.arrangements}
          />
        ) : null}
        {agreed === 'not-yet' ? (
          <InsetText>
            <p>This will be shown as something to agree before the document is signed.</p>
          </InsetText>
        ) : null}
        <RadioGroup
          name="repairs-contact"
          legend="Who should the tenant contact first about a repair?"
          options={contactOptions}
          value={contactValue}
          onChange={handleContactChange}
          error={errors.contact}
        />
        {contactValue === 'other' ? (
          <TextInput
            id="repairs-contact-other-name"
            label="Name of person or organisation"
            value={otherName}
            onChange={setOtherName}
            error={errors.otherName}
          />
        ) : null}
        {contactValue ? (
          <TextArea
            id="repairs-contact-instructions"
            label={`How should the tenant contact ${contactName}?`}
            hint="Enter a telephone number, email address or another agreed contact method."
            value={instructions}
            onChange={setInstructions}
            error={errors.instructions}
          />
        ) : null}
        <div className="govbb-btn-group">
          <button type="submit" className="govbb-btn">
            Continue
          </button>
        </div>
      </form>
      <DeleteAnswersAction />
    </div>
  )
}
