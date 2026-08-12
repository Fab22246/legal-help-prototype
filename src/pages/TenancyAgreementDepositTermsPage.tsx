import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { RadioGroup } from '../components/forms/RadioGroup'
import { TextArea } from '../components/forms/TextArea'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { InsetText } from '../components/tenancy/InsetText'
import { useStageGate } from '../components/tenancy/useStageGate'
import { useTenancyBuilder, type YesNotYet } from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'

type View = 'form' | 'confirm-delete'

interface Errors {
  agreed?: string
  wording?: string
}

const AGREED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'not-yet', label: 'Not yet' },
]

export function TenancyAgreementDepositTermsPage() {
  const navigate = useNavigate()
  const { state, saveDepositTerms, clearDepositTermsWording } = useTenancyBuilder()
  const gate = useStageGate('deposit-terms')

  const [agreed, setAgreed] = useState<YesNotYet | undefined>(state.depositTerms?.agreed)
  const [wording, setWording] = useState(state.depositTerms?.wording ?? '')
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

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.agreed) items.push({ fieldId: 'deposit-terms-agreed-yes', message: errors.agreed })
    if (errors.wording) items.push({ fieldId: 'deposit-terms-wording', message: errors.wording })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />
  // This route is only available when a deposit will be paid.
  if (state.deposit?.willBePaid !== 'yes')
    return <Navigate to="/renting-home/agreement/bills" replace />

  const savedWordingExists = state.depositTerms?.agreed === 'yes' && !!state.depositTerms.wording

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}

    if (!agreed) {
      next.agreed = 'Select whether everyone has agreed what will happen to the deposit.'
    } else if (agreed === 'yes' && !wording.trim()) {
      next.wording = 'Enter what has been agreed about the deposit.'
    }

    // Changing a saved Yes (with wording) to Not yet needs confirmation first.
    if (agreed === 'not-yet' && savedWordingExists) {
      setErrors({})
      setView('confirm-delete')
      return
    }

    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }

    if (agreed === 'yes') {
      saveDepositTerms({ agreed: 'yes', wording: wording.trim() })
    } else {
      saveDepositTerms({ agreed: 'not-yet' })
    }
    navigate('/renting-home/agreement/bills')
  }

  if (view === 'confirm-delete') {
    return (
      <div className="page">
        <BackLink to="/renting-home/agreement/deposit">Back</BackLink>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Delete what you entered about the deposit?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Changing this answer will delete what you entered about the deposit. Your other answers
          will not be affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              clearDepositTermsWording()
              navigate('/renting-home/agreement/bills')
            }}
          >
            Delete deposit information
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              setAgreed('yes')
              setWording(state.depositTerms?.wording ?? '')
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
      <BackLink to="/renting-home/agreement/deposit">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          What happens to the deposit
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <RadioGroup
          name="deposit-terms-agreed"
          legend="Have all landlords and tenants agreed what will happen to the deposit at the end of the tenancy?"
          options={AGREED_OPTIONS}
          value={agreed}
          onChange={(v) => setAgreed(v as YesNotYet)}
          error={errors.agreed}
        />
        {agreed === 'yes' ? (
          <TextArea
            id="deposit-terms-wording"
            label="What have they agreed?"
            hint="Include when any money should be returned and any costs that may be taken from it."
            value={wording}
            onChange={setWording}
            error={errors.wording}
          />
        ) : null}
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
