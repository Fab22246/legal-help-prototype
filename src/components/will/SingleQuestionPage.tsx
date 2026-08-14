import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { RadioGroup } from '../forms/RadioGroup'
import { ErrorSummary, type ErrorSummaryItem } from '../forms/ErrorSummary'
import { ClearMyAnswersLink } from './WillPage'

export interface QuestionOption {
  value: string
  label: string
  hint?: string
}

interface SingleQuestionPageProps {
  title: string
  name: string
  options: QuestionOption[]
  hint?: string
  initialValue?: string
  // Error shown when no option is selected (built from the spec's rule).
  requiredError: string
  onSubmit: (value: string) => void
  back?: ReactNode
  continueLabel?: string
}

// Reusable single radio-question page using the existing form components, with
// error-summary focus and a Clear my answers link.
export function SingleQuestionPage({
  title,
  name,
  options,
  hint,
  initialValue,
  requiredError,
  onSubmit,
  back,
  continueLabel = 'Continue',
}: SingleQuestionPageProps) {
  const [value, setValue] = useState<string | undefined>(initialValue)
  const [error, setError] = useState<string | undefined>()
  const [focusSummary, setFocusSummary] = useState(false)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    if (focusSummary) {
      summaryRef.current?.focus()
      setFocusSummary(false)
    }
  }, [focusSummary])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!value) {
      setError(requiredError)
      setFocusSummary(true)
      return
    }
    setError(undefined)
    onSubmit(value)
  }

  const items: ErrorSummaryItem[] = error ? [{ fieldId: `${name}-${options[0].value}`, message: error }] : []

  return (
    <div className="page">
      {back}
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          {title}
        </h1>
      </div>
      <ErrorSummary items={items} ref={summaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <RadioGroup
          name={name}
          legend={title}
          hint={hint}
          options={options}
          value={value}
          onChange={setValue}
          error={error}
        />
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
