import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackLink } from '../../components/navigation/BackLink'
import { RadioGroup } from '../../components/forms/RadioGroup'
import { ErrorSummary, type ErrorSummaryItem } from '../../components/forms/ErrorSummary'
import { ClearMyAnswersLink } from '../../components/will/WillPage'
import { useWillGuard } from '../../components/will/useWillGuard'
import { useWillState } from '../../state/will/WillState'
import { radioSteps } from '../../state/will/radioSteps'
import { changeDestination, nextStep } from '../../state/will/journey'
import { computeDerived } from '../../state/will/routeEngine'
import { requiredRadioError } from '../../state/will/validation'
import { stepPath, willPaths } from '../../state/will/willPaths'

export function RadioStepPage({ id, mode }: { id: string; mode: 'forward' | 'change' }) {
  const active = useWillGuard()
  const { answers, applyAndGet, safeguardingClear } = useWillState()
  const navigate = useNavigate()
  const def = radioSteps[id]

  const [value, setValue] = useState<string | undefined>(() => def?.get?.(answers))
  const [error, setError] = useState<string | undefined>()
  const [focusSummary, setFocusSummary] = useState(false)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [id])

  useEffect(() => {
    if (focusSummary) {
      summaryRef.current?.focus()
      setFocusSummary(false)
    }
  }, [focusSummary])

  const items: ErrorSummaryItem[] = useMemo(
    () => (error && def ? [{ fieldId: `${def.id}-${def.options[0].value}`, message: error }] : []),
    [error, def],
  )

  if (!active) return null
  if (!def) return null

  function proceed(destination: string) {
    if (destination === 'cya') {
      navigate(willPaths.checkYourAnswers)
      return
    }
    navigate(stepPath(destination) + (mode === 'change' ? '?mode=change' : ''))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!value) {
      setError(requiredRadioError(def.h1))
      setFocusSummary(true)
      return
    }
    setError(undefined)

    if (def.safeguarding) {
      if (value === 'yes') {
        safeguardingClear()
        navigate(stepPath('t2'))
        return
      }
      proceed(mode === 'change' ? 'cya' : 's3')
      return
    }

    const next = applyAndGet((draft) => def.set?.(draft, value))
    const derived = computeDerived(next)
    proceed(mode === 'change' ? changeDestination(next, derived) : nextStep(next, derived, id))
  }

  return (
    <div className="page">
      {mode === 'change' ? (
        <BackLink to={willPaths.checkYourAnswers}>Back</BackLink>
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
          {def.h1}
        </h1>
      </div>
      <ErrorSummary items={items} ref={summaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <RadioGroup
          name={def.id}
          legend={def.h1}
          hint={def.hint?.(answers)}
          options={def.options}
          value={value}
          onChange={setValue}
          error={error}
        />
        <div className="govbb-btn-group">
          <button type="submit" className="govbb-btn">
            Continue
          </button>
        </div>
      </form>
      <ClearMyAnswersLink />
    </div>
  )
}
