import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { RadioGroup } from '../components/forms/RadioGroup'
import { MoneyInput } from '../components/forms/MoneyInput'
import { TextInput } from '../components/forms/TextInput'
import { TextArea } from '../components/forms/TextArea'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { InsetText } from '../components/tenancy/InsetText'
import { useStageGate } from '../components/tenancy/useStageGate'
import {
  useTenancyBuilder,
  parseRentAmount,
  type BillArrangement,
  type BillAmountBasis,
  type BillFrequency,
  type BillRecord,
  type BillService,
  type YesNotYet,
} from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'

type View = 'decision' | 'form' | 'list'

interface Errors {
  agreed?: string
  service?: string
  otherServiceName?: string
  duplicate?: string
  arrangement?: string
  amountBasis?: string
  fixedAmount?: string
  fixedFrequency?: string
  otherFrequency?: string
  amountAnotherWay?: string
  whenToPay?: string
  arrangementDescription?: string
}

const AGREED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'not-yet', label: 'Not yet' },
]
const SERVICE_OPTIONS = [
  { value: 'water', label: 'Water' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'gas', label: 'Gas' },
  { value: 'internet', label: 'Internet' },
  { value: 'television', label: 'Television service' },
  { value: 'waste', label: 'Waste collection' },
  { value: 'gardening', label: 'Gardening or yard care' },
  { value: 'cleaning', label: 'Cleaning or maintenance of shared areas' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
]
const ARRANGEMENT_OPTIONS = [
  { value: 'included-in-rent', label: 'The cost is included in the rent' },
  { value: 'tenant-direct', label: 'The tenant pays for it directly' },
  { value: 'tenant-pays-separately', label: 'The tenant pays the landlord or agent separately' },
  { value: 'landlord-pays', label: 'The landlord pays the cost' },
  { value: 'another-arrangement', label: 'Another arrangement' },
]
const AMOUNT_BASIS_OPTIONS = [
  { value: 'fixed', label: 'A fixed amount' },
  { value: 'as-billed', label: 'The amount shown on the bill' },
  { value: 'another-way', label: 'Another way' },
]
const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'every-2-weeks', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'every-3-months', label: 'Every 3 months' },
  { value: 'every-6-months', label: 'Every 6 months' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'other', label: 'Other' },
]

function labelOf(options: { value: string; label: string }[], value: string | undefined): string {
  return options.find((o) => o.value === value)?.label ?? ''
}

function billName(rec: { service: BillService; otherServiceName?: string }): string {
  if (rec.service === 'other') return rec.otherServiceName ?? ''
  return labelOf(SERVICE_OPTIONS, rec.service)
}

function billKey(service: BillService | undefined, otherServiceName: string | undefined): string {
  if (!service) return ''
  if (service === 'other') return `other:${(otherServiceName ?? '').trim().toLowerCase()}`
  return service
}

function billDetailLines(rec: BillRecord): string[] {
  const lines = [labelOf(ARRANGEMENT_OPTIONS, rec.arrangement)]
  if (rec.arrangement === 'tenant-pays-separately') {
    if (rec.amountBasis === 'fixed') {
      if (rec.fixedAmount) lines.push(`BDS $${rec.fixedAmount}`)
      lines.push(
        rec.fixedFrequency === 'other'
          ? (rec.otherFrequency ?? '')
          : labelOf(FREQUENCY_OPTIONS, rec.fixedFrequency),
      )
    } else if (rec.amountBasis === 'as-billed') {
      lines.push('The amount shown on the bill')
    } else if (rec.amountBasis === 'another-way' && rec.amountAnotherWay) {
      lines.push(rec.amountAnotherWay)
    }
    if (rec.whenToPay) lines.push(rec.whenToPay)
  }
  if (rec.arrangement === 'another-arrangement' && rec.arrangementDescription) {
    lines.push(rec.arrangementDescription)
  }
  return lines.filter(Boolean)
}

export function TenancyAgreementBillsPage() {
  const navigate = useNavigate()
  const {
    state,
    saveBillsAgreed,
    clearBillsRecords,
    setBillDraft,
    clearBillDraft,
    saveBillDraft,
    removeBill,
    startEditingBill,
  } = useTenancyBuilder()

  const gate = useStageGate('bills')
  const draft = state.editing?.billDraft
  const records = state.bills?.records ?? []
  const depositPaid = state.deposit?.willBePaid === 'yes'
  const decisionBackTo = depositPaid
    ? '/renting-home/agreement/deposit-terms'
    : '/renting-home/agreement/deposit'

  const [agreed, setAgreed] = useState<YesNotYet | undefined>(state.bills?.agreed)
  const [view, setView] = useState<View>(() => (draft ? 'form' : 'decision'))
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const [confirmDeleteRecords, setConfirmDeleteRecords] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [view, pendingRemoveId, confirmDeleteRecords])

  useEffect(() => {
    if (focusErrorSummary) {
      errorSummaryRef.current?.focus()
      setFocusErrorSummary(false)
    }
  }, [focusErrorSummary])

  useEffect(() => {
    if (gate.kind !== 'ok') return
    if (view === 'form' && !draft) setBillDraft({})
  }, [gate.kind, view, draft, setBillDraft])

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.agreed) items.push({ fieldId: 'bills-agreed-yes', message: errors.agreed })
    if (errors.service) items.push({ fieldId: 'bill-service-water', message: errors.service })
    if (errors.otherServiceName)
      items.push({ fieldId: 'bill-other-service-name', message: errors.otherServiceName })
    if (errors.duplicate) items.push({ fieldId: 'bill-service-water', message: errors.duplicate })
    if (errors.arrangement)
      items.push({ fieldId: 'bill-arrangement-included-in-rent', message: errors.arrangement })
    if (errors.amountBasis)
      items.push({ fieldId: 'bill-amount-basis-fixed', message: errors.amountBasis })
    if (errors.fixedAmount) items.push({ fieldId: 'bill-fixed-amount', message: errors.fixedAmount })
    if (errors.fixedFrequency)
      items.push({ fieldId: 'bill-fixed-frequency-weekly', message: errors.fixedFrequency })
    if (errors.otherFrequency)
      items.push({ fieldId: 'bill-other-frequency', message: errors.otherFrequency })
    if (errors.amountAnotherWay)
      items.push({ fieldId: 'bill-amount-another-way', message: errors.amountAnotherWay })
    if (errors.whenToPay) items.push({ fieldId: 'bill-when-to-pay', message: errors.whenToPay })
    if (errors.arrangementDescription)
      items.push({ fieldId: 'bill-arrangement-description', message: errors.arrangementDescription })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function continueToNextStage() {
    navigate('/renting-home/agreement/occupants')
  }

  function handleDecisionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!agreed) {
      setErrors({ agreed: 'Select whether everyone has agreed how bills and services will be paid.' })
      setFocusErrorSummary(true)
      return
    }
    setErrors({})
    if (agreed === 'yes') {
      saveBillsAgreed('yes')
      setView(records.length === 0 ? 'form' : 'list')
      return
    }
    // Not yet
    if (records.length > 0) {
      setConfirmDeleteRecords(true)
      return
    }
    saveBillsAgreed('not-yet')
    continueToNextStage()
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}
    const service = draft?.service
    if (!service) {
      next.service = 'Select a bill or service.'
    } else if (service === 'other' && !draft?.otherServiceName?.trim()) {
      next.otherServiceName = 'Enter the name of the bill or service.'
    }

    // Duplicate check (only meaningful once the service is identified).
    if (service && (service !== 'other' || draft?.otherServiceName?.trim())) {
      const key = billKey(service, draft?.otherServiceName)
      const clash = records.some(
        (r) => r.id !== draft?.editingId && billKey(r.service, r.otherServiceName) === key,
      )
      if (clash) {
        next.duplicate = 'You have already added this bill or service. Change the saved answer instead.'
      }
    }

    const arrangement = draft?.arrangement
    if (!arrangement) {
      next.arrangement = 'Select how the bill or service will be paid.'
    } else if (arrangement === 'tenant-pays-separately') {
      const amountBasis = draft?.amountBasis
      if (!amountBasis) {
        next.amountBasis = 'Select how the amount will be worked out.'
      } else if (amountBasis === 'fixed') {
        const parsed = draft?.fixedAmount ? parseRentAmount(draft.fixedAmount.trim()) : null
        if (parsed === null || parsed <= 0) {
          next.fixedAmount = 'Enter an amount greater than BDS $0.'
        }
        if (!draft?.fixedFrequency) {
          next.fixedFrequency = 'Select how often the amount will be paid.'
        } else if (draft.fixedFrequency === 'other' && !draft?.otherFrequency?.trim()) {
          next.otherFrequency = 'Enter how often the amount will be paid.'
        }
      } else if (amountBasis === 'another-way' && !draft?.amountAnotherWay?.trim()) {
        next.amountAnotherWay = 'Enter how the amount will be worked out.'
      }
      if (!draft?.whenToPay?.trim()) {
        next.whenToPay = 'Enter when the tenant must pay.'
      }
    } else if (arrangement === 'another-arrangement' && !draft?.arrangementDescription?.trim()) {
      next.arrangementDescription = 'Describe the payment arrangement.'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }
    saveBillDraft()
    setView('list')
  }

  // --- Confirmation: delete all bills records (Yes -> Not yet) ---------------
  if (confirmDeleteRecords) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Delete the bills and services?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Changing this answer will delete the bills and services you added. Your other answers will
          not be affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              clearBillsRecords()
              setConfirmDeleteRecords(false)
              continueToNextStage()
            }}
          >
            Delete bills and services
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              setAgreed('yes')
              setConfirmDeleteRecords(false)
            }}
          >
            Cancel
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  // --- Confirmation: remove one bill ----------------------------------------
  if (pendingRemoveId) {
    const target = records.find((r) => r.id === pendingRemoveId)
    const name = target ? billName(target) : 'this bill or service'
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Remove {name}?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          This will delete the payment arrangement for {name}. Your other answers will not be
          affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              removeBill(pendingRemoveId)
              setPendingRemoveId(null)
              const remaining = records.filter((r) => r.id !== pendingRemoveId)
              setView(remaining.length === 0 ? 'form' : 'list')
            }}
          >
            Remove {name}
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => setPendingRemoveId(null)}
          >
            Cancel
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  // --- List view ------------------------------------------------------------
  if (view === 'list') {
    return (
      <div className="page">
        <button type="button" className="govbb-back-link" onClick={() => setView('decision')}>
          <span className="govbb-back-link__icon" aria-hidden="true">
            ←
          </span>{' '}
          Back
        </button>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Bills and services
          </h1>
          <p className="page__text">You have added these bills and services.</p>
        </div>
        <StorageWarning />
        <ul className="govbb-summary-list">
          {records.map((r) => {
            const name = billName(r)
            return (
              <li className="govbb-summary-list__row" key={r.id}>
                <span className="govbb-summary-list__key">{name}</span>
                <span className="govbb-summary-list__value">
                  {billDetailLines(r).map((line, i) => (
                    <span className="task-item__desc" key={i} style={{ display: 'block' }}>
                      {line}
                    </span>
                  ))}
                  <span style={{ display: 'block' }}>
                    <button
                      type="button"
                      className="govbb-btn--link"
                      onClick={() => {
                        startEditingBill(r.id)
                        setErrors({})
                        setView('form')
                      }}
                    >
                      Change<span className="govbb-visually-hidden"> {name}</span>
                    </button>{' '}
                    <button
                      type="button"
                      className="govbb-btn--link"
                      onClick={() => setPendingRemoveId(r.id)}
                    >
                      Remove<span className="govbb-visually-hidden"> {name}</span>
                    </button>
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              clearBillDraft()
              setErrors({})
              setView('form')
            }}
          >
            Add another bill or service
          </button>
          <button type="button" className="govbb-btn" onClick={continueToNextStage}>
            Continue
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  // --- Add / edit form view -------------------------------------------------
  if (view === 'form') {
    const service = draft?.service
    const arrangement = draft?.arrangement
    const amountBasis = draft?.amountBasis
    return (
      <div className="page">
        <button type="button" className="govbb-back-link" onClick={() => setView('decision')}>
          <span className="govbb-back-link__icon" aria-hidden="true">
            ←
          </span>{' '}
          Back
        </button>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Add a bill or service
          </h1>
        </div>
        <StorageWarning />
        <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
        <form className="govbb-form stack" onSubmit={handleFormSubmit} noValidate>
          <RadioGroup
            name="bill-service"
            legend="What bill or service are you adding?"
            options={SERVICE_OPTIONS}
            value={service}
            onChange={(v) =>
              setBillDraft({
                service: v as BillService,
                otherServiceName: v === 'other' ? draft?.otherServiceName : undefined,
              })
            }
            error={errors.service ?? errors.duplicate}
          />
          {service === 'other' ? (
            <TextInput
              id="bill-other-service-name"
              label="Name of bill or service"
              value={draft?.otherServiceName ?? ''}
              onChange={(v) => setBillDraft({ otherServiceName: v })}
              error={errors.otherServiceName}
            />
          ) : null}
          <RadioGroup
            name="bill-arrangement"
            legend="How will this bill or service be paid?"
            options={ARRANGEMENT_OPTIONS}
            value={arrangement}
            onChange={(v) =>
              setBillDraft({
                arrangement: v as BillArrangement,
                amountBasis: undefined,
                fixedAmount: undefined,
                fixedFrequency: undefined,
                otherFrequency: undefined,
                amountAnotherWay: undefined,
                whenToPay: undefined,
                arrangementDescription: undefined,
              })
            }
            error={errors.arrangement}
          />
          {arrangement === 'tenant-pays-separately' ? (
            <>
              <RadioGroup
                name="bill-amount-basis"
                legend="How is the amount worked out?"
                options={AMOUNT_BASIS_OPTIONS}
                value={amountBasis}
                onChange={(v) =>
                  setBillDraft({
                    amountBasis: v as BillAmountBasis,
                    fixedAmount: undefined,
                    fixedFrequency: undefined,
                    otherFrequency: undefined,
                    amountAnotherWay: undefined,
                  })
                }
                error={errors.amountBasis}
              />
              {amountBasis === 'fixed' ? (
                <>
                  <MoneyInput
                    id="bill-fixed-amount"
                    label="How much will the tenant pay?"
                    value={draft?.fixedAmount ?? ''}
                    onChange={(v) => setBillDraft({ fixedAmount: v })}
                    error={errors.fixedAmount}
                  />
                  <RadioGroup
                    name="bill-fixed-frequency"
                    legend="How often will the tenant pay this amount?"
                    options={FREQUENCY_OPTIONS}
                    value={draft?.fixedFrequency}
                    onChange={(v) =>
                      setBillDraft({
                        fixedFrequency: v as BillFrequency,
                        otherFrequency: v === 'other' ? draft?.otherFrequency : undefined,
                      })
                    }
                    error={errors.fixedFrequency}
                  />
                  {draft?.fixedFrequency === 'other' ? (
                    <TextInput
                      id="bill-other-frequency"
                      label="How often will the tenant pay?"
                      value={draft?.otherFrequency ?? ''}
                      onChange={(v) => setBillDraft({ otherFrequency: v })}
                      error={errors.otherFrequency}
                    />
                  ) : null}
                </>
              ) : null}
              {amountBasis === 'another-way' ? (
                <TextArea
                  id="bill-amount-another-way"
                  label="How is the amount worked out?"
                  value={draft?.amountAnotherWay ?? ''}
                  onChange={(v) => setBillDraft({ amountAnotherWay: v })}
                  error={errors.amountAnotherWay}
                />
              ) : null}
              <TextInput
                id="bill-when-to-pay"
                label="When must the tenant pay?"
                hint="For example, enter the day of the month or how long after the bill is received."
                value={draft?.whenToPay ?? ''}
                onChange={(v) => setBillDraft({ whenToPay: v })}
                error={errors.whenToPay}
              />
            </>
          ) : null}
          {arrangement === 'another-arrangement' ? (
            <TextArea
              id="bill-arrangement-description"
              label="Describe the payment arrangement."
              value={draft?.arrangementDescription ?? ''}
              onChange={(v) => setBillDraft({ arrangementDescription: v })}
              error={errors.arrangementDescription}
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

  // --- Decision view --------------------------------------------------------
  return (
    <div className="page">
      <BackLink to={decisionBackTo}>Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Bills and services
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleDecisionSubmit} noValidate>
        <RadioGroup
          name="bills-agreed"
          legend="Have all landlords and tenants agreed how bills and services for the home will be paid?"
          options={AGREED_OPTIONS}
          value={agreed}
          onChange={(v) => setAgreed(v as YesNotYet)}
          error={errors.agreed}
        />
        {agreed === 'not-yet' ? (
          <InsetText>
            <p>This will be shown as something to agree before the document is signed.</p>
          </InsetText>
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
