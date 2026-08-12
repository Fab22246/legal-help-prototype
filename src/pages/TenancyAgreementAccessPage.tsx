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
import { useTenancyBuilder, type AccessStage, type YesNotYet } from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'

type View = 'form' | 'confirm-wording'

interface Errors {
  agreed?: string
  wording?: string
}

const AGREED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'not-yet', label: 'Not yet' },
]

export function TenancyAgreementAccessPage() {
  const navigate = useNavigate()
  const { state, saveAccess } = useTenancyBuilder()
  const gate = useStageGate('access')

  const [agreed, setAgreed] = useState<YesNotYet | undefined>(state.access?.agreed)
  const [wording, setWording] = useState(state.access?.wording ?? '')
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
    if (errors.agreed) items.push({ fieldId: 'access-agreed-yes', message: errors.agreed })
    if (errors.wording) items.push({ fieldId: 'access-wording', message: errors.wording })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

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
      next.agreed =
        'Select whether everyone has agreed how and when the landlord or agent may enter the home.'
    } else if (agreed === 'yes' && !wording.trim()) {
      next.wording = 'Enter what has been agreed about access to the home.'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }
    const access: AccessStage = { agreed: agreed as YesNotYet }
    if (agreed === 'yes') access.wording = wording.trim()
    saveAccess(access)
    navigate('/renting-home/agreement/pets-smoking')
  }

  if (view === 'confirm-wording') {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Delete what you entered about access?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Changing this answer will delete what you entered about access to the home. Your other
          answers will not be affected.
        </p>
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
            Delete access information
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
      <BackLink to="/renting-home/agreement/repairs">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Access to the home
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <RadioGroup
          name="access-agreed"
          legend="Have all landlords and tenants agreed how and when the landlord or agent may enter the home?"
          options={AGREED_OPTIONS}
          value={agreed}
          onChange={handleAgreedChange}
          error={errors.agreed}
        />
        {agreed === 'yes' ? (
          <TextArea
            id="access-wording"
            label="What have they agreed about access to the home?"
            hint="Include how much notice should normally be given, why the landlord or agent may enter and what should happen in an emergency."
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
