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
import { useTenancyBuilder, type EndingStage, type YesNotYet } from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'
import { formatBarbadosDate } from '../state/barbadosDate'

type View = 'form' | 'confirm-wording'

interface Errors {
  agreed?: string
  wording?: string
}

const AGREED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'not-yet', label: 'Not yet' },
]

export function TenancyAgreementEndingPage() {
  const navigate = useNavigate()
  const { state, saveEnding } = useTenancyBuilder()
  const gate = useStageGate('ending')

  const hasEndDate = state.dates?.hasAgreedEndDate === 'yes' && !!state.dates.endDate
  const endDateText = state.dates?.endDate ? formatBarbadosDate(state.dates.endDate) : null

  const [agreed, setAgreed] = useState<YesNotYet | undefined>(state.ending?.agreed)
  const [wording, setWording] = useState(state.ending?.wording ?? '')
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
    if (errors.agreed) items.push({ fieldId: 'ending-agreed-yes', message: errors.agreed })
    if (errors.wording) items.push({ fieldId: 'ending-wording', message: errors.wording })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  const legend = hasEndDate
    ? 'Have all landlords and tenants agreed whether the tenancy can end before this date?'
    : 'Have all landlords and tenants agreed how the tenancy may end?'
  const wordingLabel = hasEndDate
    ? 'What have they agreed about ending the tenancy early?'
    : 'What have they agreed about ending the tenancy?'
  const wordingHint = hasEndDate
    ? 'Include how much notice should be given and how it should be sent.'
    : 'Include how much notice a landlord or tenant should give and how it should be sent.'
  const agreedError = hasEndDate
    ? 'Select whether everyone has agreed if the tenancy can end before the saved end date.'
    : 'Select whether everyone has agreed how the tenancy may end.'
  const wordingError = hasEndDate
    ? 'Enter what has been agreed about ending the tenancy early.'
    : 'Enter what has been agreed about ending the tenancy.'
  const confirmHeading = hasEndDate
    ? 'Delete what you entered about ending the tenancy early?'
    : 'Delete what you entered about ending the tenancy?'
  const confirmText = hasEndDate
    ? 'Changing this answer will delete what you entered about ending the tenancy early. Your other answers will not be affected.'
    : 'Changing this answer will delete what you entered about ending the tenancy. Your other answers will not be affected.'

  function handleAgreedChange(value: string) {
    const next = value as YesNotYet
    if (next === 'not-yet' && wording.trim()) {
      setView('confirm-wording')
      return
    }
    setAgreed(next)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}
    if (!agreed) {
      next.agreed = agreedError
    } else if (agreed === 'yes' && !wording.trim()) {
      next.wording = wordingError
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }
    const ending: EndingStage = { agreed: agreed as YesNotYet }
    if (agreed === 'yes') ending.wording = wording.trim()
    saveEnding(ending)
    navigate('/renting-home/agreement/additional-terms')
  }

  if (view === 'confirm-wording') {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            {confirmHeading}
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">{confirmText}</p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              setAgreed('not-yet')
              setWording('')
              setView('form')
            }}
          >
            Delete ending information
          </button>
          <button type="button" className="govbb-btn--secondary" onClick={() => setView('form')}>
            Cancel
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement/using-home">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Ending the tenancy
        </h1>
        {hasEndDate && endDateText ? (
          <p className="page__text">An end date of {endDateText} was entered earlier.</p>
        ) : null}
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <RadioGroup
          name="ending-agreed"
          legend={legend}
          options={AGREED_OPTIONS}
          value={agreed}
          onChange={handleAgreedChange}
          error={errors.agreed}
        />
        {agreed === 'yes' ? (
          <TextArea
            id="ending-wording"
            label={wordingLabel}
            hint={wordingHint}
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
