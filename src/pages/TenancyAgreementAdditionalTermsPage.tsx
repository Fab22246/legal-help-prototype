import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { RadioGroup } from '../components/forms/RadioGroup'
import { TextArea } from '../components/forms/TextArea'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { InsetText } from '../components/tenancy/InsetText'
import { useStageGate } from '../components/tenancy/useStageGate'
import { useTenancyBuilder, type YesNo } from '../state/tenancyBuilderContext'
import { STAGES, hasCompletedAdditionalTerms } from '../state/tenancyBuilderStageStatus'

// The final "Tenancy questions completed" holding view is an in-page view of
// this last question stage, reusing the established holding-view pattern rather
// than a dedicated route. It is reachable only once every applicable stage is
// complete (the stage gate above guarantees the earlier stages).
type View = 'decision' | 'form' | 'list' | 'holding'

interface Errors {
  agreed?: string
  text?: string
}

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export function TenancyAgreementAdditionalTermsPage() {
  const {
    state,
    setAdditionalTermsAnswer,
    clearAdditionalTermsRecords,
    setAdditionalTermDraft,
    clearAdditionalTermDraft,
    saveAdditionalTermDraft,
    removeAdditionalTerm,
    startEditingAdditionalTerm,
  } = useTenancyBuilder()

  const gate = useStageGate('additional-terms')
  const draft = state.editing?.additionalTermDraft
  const records = state.additionalTerms?.records ?? []

  const [agreed, setAgreed] = useState<YesNo | undefined>(state.additionalTerms?.agreed)
  const [view, setView] = useState<View>(() =>
    draft ? 'form' : hasCompletedAdditionalTerms(state) ? 'holding' : 'decision',
  )
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
    if (view === 'form' && !draft) setAdditionalTermDraft({})
  }, [gate.kind, view, draft, setAdditionalTermDraft])

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.agreed)
      items.push({ fieldId: 'additional-terms-agreed-yes', message: errors.agreed })
    if (errors.text) items.push({ fieldId: 'additional-term-text', message: errors.text })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function handleDecisionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!agreed) {
      setErrors({ agreed: 'Select whether the landlords and tenants have agreed anything else.' })
      setFocusErrorSummary(true)
      return
    }
    setErrors({})
    if (agreed === 'yes') {
      setAdditionalTermsAnswer('yes')
      setView(records.length === 0 ? 'form' : 'list')
      return
    }
    if (records.length > 0) {
      setConfirmDeleteRecords(true)
      return
    }
    setAdditionalTermsAnswer('no')
    setView('holding')
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft?.text?.trim()) {
      setErrors({ text: 'Enter the other agreed point.' })
      setFocusErrorSummary(true)
      return
    }
    setErrors({})
    saveAdditionalTermDraft()
    setView('list')
  }

  if (confirmDeleteRecords) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Delete the other agreed points?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Changing this answer will delete the other agreed points you added. Your other answers
          will not be affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              clearAdditionalTermsRecords()
              setConfirmDeleteRecords(false)
              setView('holding')
            }}
          >
            Delete agreed points
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

  if (pendingRemoveId) {
    const target = records.find((t) => t.id === pendingRemoveId)
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Remove this agreed point?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          This will delete this agreed point. Your other answers will not be affected.
        </p>
        {target ? (
          <ul className="govbb-summary-list">
            <li className="govbb-summary-list__row">
              <span className="govbb-summary-list__value agreed-point-text">{target.text}</span>
            </li>
          </ul>
        ) : null}
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              removeAdditionalTerm(pendingRemoveId)
              setPendingRemoveId(null)
              const remaining = records.filter((t) => t.id !== pendingRemoveId)
              setView(remaining.length === 0 ? 'decision' : 'list')
            }}
          >
            Remove agreed point
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
            Other agreed points
          </h1>
          <p className="page__text">These points will be shown for a lawyer to check.</p>
        </div>
        <StorageWarning />
        <ul className="govbb-summary-list">
          {records.map((t) => (
            <li className="govbb-summary-list__row" key={t.id}>
              <span className="govbb-summary-list__value">
                <span className="task-item__desc agreed-point-text" style={{ display: 'block' }}>
                  {t.text}
                </span>
                <span style={{ display: 'block' }}>
                  <button
                    type="button"
                    className="govbb-btn--link"
                    onClick={() => {
                      startEditingAdditionalTerm(t.id)
                      setErrors({})
                      setView('form')
                    }}
                  >
                    Change<span className="govbb-visually-hidden"> agreed point: {t.text}</span>
                  </button>{' '}
                  <button
                    type="button"
                    className="govbb-btn--link"
                    onClick={() => setPendingRemoveId(t.id)}
                  >
                    Remove<span className="govbb-visually-hidden"> agreed point: {t.text}</span>
                  </button>
                </span>
              </span>
            </li>
          ))}
        </ul>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              clearAdditionalTermDraft()
              setErrors({})
              setView('form')
            }}
          >
            Add another agreed point
          </button>
          <button
            type="button"
            className="govbb-btn"
            onClick={() => setView('holding')}
          >
            Continue
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  if (view === 'holding') {
    return (
      <div className="page">
        <button
          type="button"
          className="govbb-back-link"
          onClick={() => setView(records.length > 0 ? 'list' : 'decision')}
        >
          <span className="govbb-back-link__icon" aria-hidden="true">
            ←
          </span>{' '}
          Back
        </button>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Tenancy questions completed
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          You have completed the tenancy questions in this version of the prototype.
        </p>
        <p className="page__text">You can go back to check or change your answers.</p>
        <p className="page__text">No tenancy agreement has been created.</p>
        <DeleteAnswersAction />
      </div>
    )
  }

  if (view === 'form') {
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
            Add another agreed point
          </h1>
        </div>
        <StorageWarning />
        <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
        <form className="govbb-form stack" onSubmit={handleFormSubmit} noValidate>
          <TextArea
            id="additional-term-text"
            label="What other point have all landlords and tenants agreed?"
            value={draft?.text ?? ''}
            onChange={(v) => setAdditionalTermDraft({ text: v })}
            error={errors.text}
          />
          <InsetText>
            <p>
              This will be shown as something for a lawyer to check. It will not be added to the
              provisional agreement automatically.
            </p>
          </InsetText>
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

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement/ending">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Other agreed points
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleDecisionSubmit} noValidate>
        <RadioGroup
          name="additional-terms-agreed"
          legend="Have all landlords and tenants agreed anything else that was not covered in these questions?"
          options={YES_NO_OPTIONS}
          value={agreed}
          onChange={(v) => setAgreed(v as YesNo)}
          error={errors.agreed}
        />
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
