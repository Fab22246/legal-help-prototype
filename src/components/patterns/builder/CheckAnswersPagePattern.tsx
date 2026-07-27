import type { ReactNode } from 'react'
import { BackLink } from '../../navigation/BackLink'
import { PrototypeNotice } from '../../PrototypeNotice'
import { CheckAnswersSummary, type SummarySection } from '../../CheckAnswersSummary'

interface CheckAnswersPagePatternProps {
  title?: string
  sections: SummarySection[]
  /** Slot for a notice shown before the continue action (e.g. draft warning). */
  beforeContinue?: ReactNode
  onContinue?: () => void
  continueLabel?: string
  backTo?: string
  backLabel?: string
}

// Builder-flow "check your answers" pattern. Reuses CheckAnswersSummary (which
// provides per-section Change links). Scaffold only — no builder state.
export function CheckAnswersPagePattern({
  title = 'Check your answers',
  sections,
  beforeContinue,
  onContinue,
  continueLabel = 'Continue',
  backTo = '/',
  backLabel = 'Back',
}: CheckAnswersPagePatternProps) {
  return (
    <div className="page">
      <BackLink to={backTo}>{backLabel}</BackLink>
      <div className="page__header">
        <h1 className="page__title">{title}</h1>
      </div>

      <PrototypeNotice />

      <CheckAnswersSummary sections={sections} />

      {beforeContinue}

      <div className="govbb-btn-group">
        <button type="button" className="govbb-btn" onClick={onContinue}>
          {continueLabel}
        </button>
      </div>
    </div>
  )
}
