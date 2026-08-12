import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { CheckboxGroup } from '../components/forms/CheckboxGroup'
import { RadioGroup } from '../components/forms/RadioGroup'
import { TextInput } from '../components/forms/TextInput'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { useStageGate } from '../components/tenancy/useStageGate'
import { partyDisplayName } from '../components/tenancy/partyDisplayName'
import {
  useTenancyBuilder,
  type PaymentMethod,
  type PaymentStage,
  type RentRecipient,
} from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'

interface Errors {
  methods?: string
  otherMethod?: string
  recipient?: string
}

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank-transfer', label: 'Bank transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
]

export function TenancyAgreementPaymentPage() {
  const navigate = useNavigate()
  const { state, savePayment } = useTenancyBuilder()
  const gate = useStageGate('payment')

  const hasAgent = state.agent?.hasAgent === 'yes'
  const agentName = state.agent?.details
    ? partyDisplayName(state.agent.details, 'the agent')
    : 'the agent'
  const oneLandlord = (state.landlords?.length ?? 0) <= 1

  const [methods, setMethods] = useState<string[]>(state.payment?.methods ?? [])
  const [otherMethod, setOtherMethod] = useState(state.payment?.otherMethod ?? '')
  const [recipient, setRecipient] = useState<RentRecipient | undefined>(state.payment?.recipient)
  const [errors, setErrors] = useState<Errors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    if (focusErrorSummary) {
      errorSummaryRef.current?.focus()
      setFocusErrorSummary(false)
    }
  }, [focusErrorSummary])

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.methods) items.push({ fieldId: 'payment-method-cash', message: errors.methods })
    if (errors.otherMethod)
      items.push({ fieldId: 'payment-method-other-detail', message: errors.otherMethod })
    if (errors.recipient)
      items.push({ fieldId: 'rent-recipient-landlord', message: errors.recipient })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  const recipientOptions = [
    { value: 'landlord', label: oneLandlord ? 'The landlord' : 'The landlords' },
    { value: 'agent', label: `The agent, ${agentName}` },
  ]

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}

    if (methods.length === 0) {
      next.methods = 'Select how the rent will be paid'
    } else if (methods.includes('other') && !otherMethod.trim()) {
      next.otherMethod = 'Enter how the rent will be paid'
    }

    if (hasAgent && !recipient) {
      next.recipient = 'Select who will receive the rent'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }

    const orderedMethods = METHOD_OPTIONS.map((o) => o.value as PaymentMethod).filter((m) =>
      methods.includes(m),
    )
    const finalRecipient: RentRecipient = hasAgent ? (recipient as RentRecipient) : 'landlord'
    const payment: PaymentStage = { methods: orderedMethods, recipient: finalRecipient }
    if (methods.includes('other')) payment.otherMethod = otherMethod.trim()
    savePayment(payment)
    navigate('/renting-home/agreement/deposit')
  }

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement/rent">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Payment details
        </h1>
        <p className="page__text">
          Enter the payment details the landlords and tenants have agreed.
        </p>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <CheckboxGroup
          name="payment-method"
          legend="How will the rent be paid?"
          options={METHOD_OPTIONS}
          value={methods}
          onChange={(vals) => {
            setMethods(vals)
            if (!vals.includes('other')) setOtherMethod('')
          }}
          error={errors.methods}
        />
        {methods.includes('other') ? (
          <TextInput
            id="payment-method-other-detail"
            label="Tell us how the rent will be paid"
            value={otherMethod}
            onChange={setOtherMethod}
            error={errors.otherMethod}
          />
        ) : null}
        {hasAgent ? (
          <RadioGroup
            name="rent-recipient"
            legend="Who will receive the rent?"
            options={recipientOptions}
            value={recipient}
            onChange={(v) => setRecipient(v as RentRecipient)}
            error={errors.recipient}
          />
        ) : null}
        <div className="govbb-btn-group">
          <button type="submit" className="govbb-btn">
            Save and continue
          </button>
        </div>
      </form>
      <DeleteAnswersAction />
    </div>
  )
}
