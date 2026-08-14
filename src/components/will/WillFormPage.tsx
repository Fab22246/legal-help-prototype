import { useEffect, useRef } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorSummary, type ErrorSummaryItem } from '../forms/ErrorSummary'
import { ClearMyAnswersLink } from './WillPage'
import { willPaths } from '../../state/will/willPaths'

interface WillFormPageProps {
  title: string
  mode: 'forward' | 'change'
  errorItems: ErrorSummaryItem[]
  // Increments on each submit attempt so the shell can move focus to the summary.
  submitAttempt: number
  onSubmit: () => void
  children: ReactNode
  continueLabel?: string
  intro?: string
}

// Shared shell for a will question page: heading focus, error-summary focus,
// Back behaviour and the Clear my answers link.
export function WillFormPage({
  title,
  mode,
  errorItems,
  submitAttempt,
  onSubmit,
  children,
  continueLabel = 'Continue',
  intro,
}: WillFormPageProps) {
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    if (submitAttempt > 0 && errorItems.length > 0) summaryRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitAttempt])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <div className="page">
      {mode === 'change' ? (
        <button type="button" className="govbb-back-link" onClick={() => navigate(willPaths.checkYourAnswers)}>
          <span className="govbb-back-link__icon" aria-hidden="true">
            ←
          </span>{' '}
          Back
        </button>
      ) : (
        <button type="button" className="govbb-back-link" onClick={() => navigate(-1)}>
          <span className="govbb-back-link__icon" aria-hidden="true">
            ←
          </span>{' '}
          Back
        </button>
      )}
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          {title}
        </h1>
        {intro ? <p className="page__text">{intro}</p> : null}
      </div>
      <ErrorSummary items={errorItems} ref={summaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        {children}
        <div className="govbb-btn-group">
          <button type="submit" className="govbb-btn">
            {continueLabel}
          </button>
        </div>
      </form>
      <ClearMyAnswersLink />
    </div>
  )
}
