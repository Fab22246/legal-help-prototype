import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { DateInput } from '../components/forms/DateInput'
import { RadioGroup } from '../components/forms/RadioGroup'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { useStageGate } from '../components/tenancy/useStageGate'
import {
  useTenancyBuilder,
  type DateFields,
  type YesNo,
} from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'
import { compareYmd, parseYmd, todayInBarbados } from '../state/barbadosDate'

interface Errors {
  startDate?: string
  hasAgreedEndDate?: string
  endDate?: string
}

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

// Date parsing / today-in-Barbados live in src/state/barbadosDate.ts.
// Parsing runs in UTC to reject invalid Gregorian dates (e.g. 31 February);
// comparisons are performed on Ymd tuples to keep them timezone-agnostic.

type View = 'form' | 'confirm-remove-end' | 'confirm-add-end'

export function TenancyAgreementDatesPage() {
  const navigate = useNavigate()
  const { state, saveDates, saveDatesClearEnding } = useTenancyBuilder()
  const gate = useStageGate('dates')

  const [startDate, setStartDate] = useState<DateFields>(
    state.dates?.startDate ?? { day: '', month: '', year: '' },
  )
  const [hasEnd, setHasEnd] = useState<YesNo | undefined>(state.dates?.hasAgreedEndDate)
  const [endDate, setEndDate] = useState<DateFields>(
    state.dates?.endDate ?? { day: '', month: '', year: '' },
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

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.startDate) items.push({ fieldId: 'start-date-day', message: errors.startDate })
    if (errors.hasAgreedEndDate) items.push({ fieldId: 'has-end-date-yes', message: errors.hasAgreedEndDate })
    if (errors.endDate) items.push({ fieldId: 'end-date-day', message: errors.endDate })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}
    const parsedStart = parseYmd(startDate)
    if (!parsedStart) {
      const anyEntered = startDate.day || startDate.month || startDate.year
      next.startDate = anyEntered ? 'Enter a real tenancy start date' : 'Enter the tenancy start date'
    } else if (compareYmd(parsedStart, todayInBarbados()) < 0) {
      next.startDate = 'The tenancy start date must be today or later'
    }
    if (!hasEnd) {
      next.hasAgreedEndDate = 'Select whether an end date has been agreed'
    }
    if (hasEnd === 'yes') {
      const parsedEnd = parseYmd(endDate)
      if (!parsedEnd) {
        const anyEntered = endDate.day || endDate.month || endDate.year
        next.endDate = anyEntered ? 'Enter a real tenancy end date' : 'Enter the tenancy end date'
      } else if (parsedStart && compareYmd(parsedEnd, parsedStart) <= 0) {
        next.endDate = 'The tenancy end date must be after the start date'
      }
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }
    // Changing whether an agreed end date exists changes the meaning of the
    // later Ending question, so confirm before discarding any ending answer.
    const savedHasEnd = state.dates?.hasAgreedEndDate
    if (state.ending) {
      if (savedHasEnd === 'yes' && hasEnd === 'no') {
        setView('confirm-remove-end')
        return
      }
      if (savedHasEnd === 'no' && hasEnd === 'yes') {
        setView('confirm-add-end')
        return
      }
    }
    // Save.
    if (hasEnd === 'no') {
      saveDates({ startDate, hasAgreedEndDate: 'no' })
    } else {
      saveDates({ startDate, hasAgreedEndDate: 'yes', endDate })
    }
    navigate('/renting-home/agreement/rent')
  }

  if (view === 'confirm-remove-end') {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Delete the ending information?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Removing the tenancy end date will delete what you entered about ending the tenancy. Your
          other answers will not be affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              saveDatesClearEnding({ startDate, hasAgreedEndDate: 'no' })
              navigate('/renting-home/agreement/rent')
            }}
          >
            Remove end date
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              // Restore the saved end-date branch so the form reflects it.
              setHasEnd('yes')
              setEndDate(state.dates?.endDate ?? { day: '', month: '', year: '' })
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

  if (view === 'confirm-add-end') {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Delete the ending information?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Adding a tenancy end date will delete what you entered about ending the tenancy. Your
          other answers will not be affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              saveDatesClearEnding({ startDate, hasAgreedEndDate: 'yes', endDate })
              navigate('/renting-home/agreement/rent')
            }}
          >
            Add end date
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              // Restore the saved no-end-date branch.
              setHasEnd('no')
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
      <BackLink to="/renting-home/agreement/home">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Tenancy dates
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <DateInput
          namePrefix="start-date"
          legend="When will the tenancy start?"
          value={startDate}
          onChange={setStartDate}
          error={errors.startDate}
        />
        <RadioGroup
          name="has-end-date"
          legend="Have all the landlords and tenants agreed when the tenancy will end?"
          options={YES_NO_OPTIONS}
          value={hasEnd}
          onChange={(v) => setHasEnd(v as YesNo)}
          error={errors.hasAgreedEndDate}
        />
        {hasEnd === 'yes' ? (
          <DateInput
            namePrefix="end-date"
            legend="When will the tenancy end?"
            value={endDate}
            onChange={setEndDate}
            error={errors.endDate}
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
