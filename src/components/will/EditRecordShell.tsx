import { useEffect, useRef } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ErrorSummary, type ErrorSummaryItem } from '../forms/ErrorSummary'
import { ClearMyAnswersLink } from './WillPage'

interface EditRecordShellProps {
  title: string
  children: ReactNode
  errorItems: ErrorSummaryItem[]
  onSave: () => void
  saveLabel?: string
  back?: ReactNode
  focusSummary?: boolean
}

// Reusable shell for adding or editing a single record. Owns the heading focus
// and the error-summary focus; the caller supplies the fields and validation.
export function EditRecordShell({
  title,
  children,
  errorItems,
  onSave,
  saveLabel = 'Save and continue',
  back,
  focusSummary = false,
}: EditRecordShellProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    if (focusSummary) summaryRef.current?.focus()
  }, [focusSummary])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave()
  }

  return (
    <div className="page">
      {back}
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          {title}
        </h1>
      </div>
      <ErrorSummary items={errorItems} ref={summaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        {children}
        <div className="govbb-btn-group">
          <button type="submit" className="govbb-btn">
            {saveLabel}
          </button>
        </div>
      </form>
      <ClearMyAnswersLink />
    </div>
  )
}
