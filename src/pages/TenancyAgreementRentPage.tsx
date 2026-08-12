import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { MoneyInput } from '../components/forms/MoneyInput'
import { RadioGroup } from '../components/forms/RadioGroup'
import { TextInput } from '../components/forms/TextInput'
import { DateInput } from '../components/forms/DateInput'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { useStageGate } from '../components/tenancy/useStageGate'
import {
  useTenancyBuilder,
  parseRentAmount,
  type DateFields,
  type RentFrequency,
} from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'
import { parseYmd } from '../state/barbadosDate'

interface Errors {
  amount?: string
  frequency?: string
  otherFrequency?: string
  firstPaymentDue?: string
}

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'every-2-weeks', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'other', label: 'Other' },
]

export function TenancyAgreementRentPage() {
  const navigate = useNavigate()
  const { state, saveRent } = useTenancyBuilder()
  const gate = useStageGate('rent')

  const [amount, setAmount] = useState(state.rent?.amount ?? '')
  const [frequency, setFrequency] = useState<RentFrequency | undefined>(state.rent?.frequency)
  const [otherFrequency, setOtherFrequency] = useState(state.rent?.otherFrequency ?? '')
  const [firstPaymentDue, setFirstPaymentDue] = useState<DateFields>(
    state.rent?.firstPaymentDue ?? { day: '', month: '', year: '' },
  )
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
    if (errors.amount) items.push({ fieldId: 'rent-amount', message: errors.amount })
    if (errors.frequency) items.push({ fieldId: 'rent-frequency-weekly', message: errors.frequency })
    if (errors.otherFrequency)
      items.push({ fieldId: 'rent-frequency-other-detail', message: errors.otherFrequency })
    if (errors.firstPaymentDue)
      items.push({ fieldId: 'first-payment-due-day', message: errors.firstPaymentDue })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}

    const trimmedAmount = amount.trim()
    if (!trimmedAmount) {
      next.amount = 'Enter the rent amount'
    } else {
      const parsedAmount = parseRentAmount(trimmedAmount)
      if (parsedAmount === null) {
        next.amount = 'Enter the rent as an amount in Barbados dollars, for example 1200 or 1200.00'
      } else if (parsedAmount <= 0) {
        next.amount = 'Enter a rent amount greater than 0'
      }
    }

    if (!frequency) {
      next.frequency = 'Select how often the rent will be paid'
    } else if (frequency === 'other' && !otherFrequency.trim()) {
      next.otherFrequency = 'Enter how often the rent will be paid'
    }

    if (!parseYmd(firstPaymentDue)) {
      const anyEntered = firstPaymentDue.day || firstPaymentDue.month || firstPaymentDue.year
      next.firstPaymentDue = anyEntered
        ? 'Enter a real date for the first rent payment'
        : 'Enter the date the first rent payment is due'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }

    if (frequency === 'other') {
      saveRent({
        amount: trimmedAmount,
        frequency: 'other',
        otherFrequency: otherFrequency.trim(),
        firstPaymentDue,
      })
    } else {
      saveRent({ amount: trimmedAmount, frequency: frequency as RentFrequency, firstPaymentDue })
    }
    navigate('/renting-home/agreement/payment')
  }

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement/dates">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Rent details
        </h1>
        <p className="page__text">Enter the rent details the landlords and tenants have agreed.</p>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <MoneyInput
          id="rent-amount"
          label="How much is the rent?"
          value={amount}
          onChange={setAmount}
          error={errors.amount}
        />
        <RadioGroup
          name="rent-frequency"
          legend="How often will the rent be paid?"
          options={FREQUENCY_OPTIONS}
          value={frequency}
          onChange={(v) => {
            const nextFrequency = v as RentFrequency
            setFrequency(nextFrequency)
            if (nextFrequency !== 'other') setOtherFrequency('')
          }}
          error={errors.frequency}
        />
        {frequency === 'other' ? (
          <TextInput
            id="rent-frequency-other-detail"
            label="Tell us how often the rent will be paid"
            value={otherFrequency}
            onChange={setOtherFrequency}
            error={errors.otherFrequency}
          />
        ) : null}
        <DateInput
          namePrefix="first-payment-due"
          legend="When is the first rent payment due?"
          value={firstPaymentDue}
          onChange={setFirstPaymentDue}
          error={errors.firstPaymentDue}
        />
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
