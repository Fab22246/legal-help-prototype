import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWillState } from '../../state/will/WillState'
import { useWillGuard } from '../../components/will/useWillGuard'
import { ClearMyAnswersLink } from '../../components/will/WillPage'
import { InfoSummaryView } from '../../components/will/outputViews'
import { printDocument } from '../../components/will/printDocument'
import { generateInfoSummary } from '../../state/will/generateInfoSummary'
import { externalPaths, willPaths } from '../../state/will/willPaths'

export function RouteCResultPage() {
  const active = useWillGuard()
  const { answers } = useWillState()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  if (!active) return null

  const summary = generateInfoSummary(answers)

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Your information summary is ready
        </h1>
      </div>
      <p className="page__text">
        Take this summary to a lawyer. It organises the information you provided, but it is not a will.
      </p>

      <div className="govbb-btn-group">
        <button type="button" className="govbb-btn" onClick={() => printDocument('info-summary')}>
          Print information summary
        </button>
      </div>
      <p className="page__text">
        <button type="button" className="govbb-btn--link" onClick={() => navigate(willPaths.checkYourAnswers)}>
          Change my answers
        </button>
      </p>
      <p className="page__text">
        <Link className="govbb-link-default" to={externalPaths.prepareForLawyer}>
          Prepare to speak to a lawyer
        </Link>
      </p>

      <InfoSummaryView id="info-summary" document={summary} offscreen />
      <ClearMyAnswersLink />
    </div>
  )
}
