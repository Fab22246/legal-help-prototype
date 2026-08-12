import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { RadioGroup } from '../components/forms/RadioGroup'
import { MoneyInput } from '../components/forms/MoneyInput'
import { DateInput } from '../components/forms/DateInput'
import { TextInput } from '../components/forms/TextInput'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { useStageGate } from '../components/tenancy/useStageGate'
import { partyDisplayName } from '../components/tenancy/partyDisplayName'
import {
  useTenancyBuilder,
  parseRentAmount,
  type DateFields,
  type DepositStage,
  type PartyRef,
  type YesNo,
} from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'
import { parseYmd } from '../state/barbadosDate'

type View = 'form' | 'confirm-delete'

interface Errors {
  willBePaid?: string
  amount?: string
  paymentDate?: string
  recipient?: string
  otherName?: string
}

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export function TenancyAgreementDepositPage() {
  const navigate = useNavigate()
  const { state, saveDeposit, confirmNoDeposit } = useTenancyBuilder()
  const gate = useStageGate('deposit')

  const landlords = state.landlords ?? []
  const hasAgent = state.agent?.hasAgent === 'yes'
  const agentName = state.agent?.details
    ? partyDisplayName(state.agent.details, 'the agent')
    : 'the agent'

  const savedRecipient = state.deposit?.recipient
  const [willBePaid, setWillBePaid] = useState<YesNo | undefined>(state.deposit?.willBePaid)
  const [amount, setAmount] = useState(state.deposit?.amount ?? '')
  const [paymentDate, setPaymentDate] = useState<DateFields>(
    state.deposit?.paymentDate ?? { day: '', month: '', year: '' },
  )
  const [recipientValue, setRecipientValue] = useState<string | undefined>(() => {
    if (!savedRecipient) return undefined
    if (savedRecipient.kind === 'landlord') return `landlord:${savedRecipient.landlordId}`
    if (savedRecipient.kind === 'agent') return 'agent'
    return 'other'
  })
  const [otherName, setOtherName] = useState(
    savedRecipient?.kind === 'other' ? (savedRecipient.name ?? '') : '',
  )
  const [errors, setErrors] = useState<Errors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)
  const [view, setView] = useState<View>('form')

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

  const recipientOptions = [
    ...landlords.map((l) => ({
      value: `landlord:${l.id}`,
      label: partyDisplayName(l, 'this landlord'),
    })),
    ...(hasAgent ? [{ value: 'agent', label: `The agent, ${agentName}` }] : []),
    { value: 'other', label: 'Someone else' },
  ]
  const firstRecipientId = `deposit-recipient-${recipientOptions[0].value}`

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.willBePaid) items.push({ fieldId: 'deposit-will-be-paid-yes', message: errors.willBePaid })
    if (errors.amount) items.push({ fieldId: 'deposit-amount', message: errors.amount })
    if (errors.paymentDate) items.push({ fieldId: 'deposit-date-day', message: errors.paymentDate })
    if (errors.recipient) items.push({ fieldId: firstRecipientId, message: errors.recipient })
    if (errors.otherName)
      items.push({ fieldId: 'deposit-recipient-other-name', message: errors.otherName })
    return items
  }, [errors, firstRecipientId])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  const hasSavedDepositInfo =
    state.deposit?.willBePaid === 'yes' &&
    (!!state.deposit.amount ||
      !!state.deposit.paymentDate ||
      !!state.deposit.recipient ||
      !!state.depositTerms)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}

    if (!willBePaid) {
      next.willBePaid = 'Select whether a deposit will be paid.'
      setErrors(next)
      setFocusErrorSummary(true)
      return
    }

    if (willBePaid === 'no') {
      // Changing a saved Yes (with information) to No needs confirmation first.
      if (hasSavedDepositInfo) {
        setErrors({})
        setView('confirm-delete')
        return
      }
      saveDeposit({ willBePaid: 'no' })
      navigate('/renting-home/agreement/bills')
      return
    }

    // willBePaid === 'yes'
    const trimmedAmount = amount.trim()
    if (!trimmedAmount) {
      next.amount = 'Enter the deposit amount.'
    } else {
      const parsed = parseRentAmount(trimmedAmount)
      if (parsed === null || parsed <= 0) {
        next.amount = 'Enter a deposit amount greater than BDS $0.'
      }
    }

    if (!parseYmd(paymentDate)) {
      const anyEntered = paymentDate.day || paymentDate.month || paymentDate.year
      next.paymentDate = anyEntered
        ? 'Enter a real date for when the deposit must be paid.'
        : 'Enter the date the deposit must be paid.'
    }

    if (!recipientValue) {
      next.recipient = 'Select who will receive the deposit.'
    } else if (recipientValue === 'other' && !otherName.trim()) {
      next.otherName = 'Enter the name of the person or organisation receiving the deposit.'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }

    let recipient: PartyRef
    if (recipientValue === 'agent') {
      recipient = { kind: 'agent' }
    } else if (recipientValue === 'other') {
      recipient = { kind: 'other', name: otherName.trim() }
    } else {
      recipient = { kind: 'landlord', landlordId: (recipientValue as string).slice('landlord:'.length) }
    }
    const deposit: DepositStage = {
      willBePaid: 'yes',
      amount: trimmedAmount,
      paymentDate,
      recipient,
    }
    saveDeposit(deposit)
    navigate('/renting-home/agreement/deposit-terms')
  }

  if (view === 'confirm-delete') {
    return (
      <div className="page">
        <BackLink to="/renting-home/agreement/payment">Back</BackLink>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Delete the deposit information?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Changing this answer will delete the deposit information you entered. Your other answers
          will not be affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              confirmNoDeposit()
              navigate('/renting-home/agreement/bills')
            }}
          >
            Delete deposit information
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              setWillBePaid('yes')
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
      <BackLink to="/renting-home/agreement/payment">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Deposit
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <RadioGroup
          name="deposit-will-be-paid"
          legend="Will a deposit be paid?"
          options={YES_NO_OPTIONS}
          value={willBePaid}
          onChange={(v) => setWillBePaid(v as YesNo)}
          error={errors.willBePaid}
        />
        {willBePaid === 'yes' ? (
          <>
            <MoneyInput
              id="deposit-amount"
              label="How much is the deposit?"
              value={amount}
              onChange={setAmount}
              error={errors.amount}
            />
            <DateInput
              namePrefix="deposit-date"
              legend="By what date must the deposit be paid?"
              value={paymentDate}
              onChange={setPaymentDate}
              error={errors.paymentDate}
            />
            <RadioGroup
              name="deposit-recipient"
              legend="Who will receive the deposit?"
              options={recipientOptions}
              value={recipientValue}
              onChange={(v) => {
                setRecipientValue(v)
                if (v !== 'other') setOtherName('')
              }}
              error={errors.recipient}
            />
            {recipientValue === 'other' ? (
              <TextInput
                id="deposit-recipient-other-name"
                label="Name of person or organisation"
                value={otherName}
                onChange={setOtherName}
                error={errors.otherName}
              />
            ) : null}
          </>
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
