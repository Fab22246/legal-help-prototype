import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWillState } from '../../state/will/WillState'
import { useWillGuard } from '../../components/will/useWillGuard'
import { ClearMyAnswersLink } from '../../components/will/WillPage'
import { WillDocumentView, ReviewSummaryView } from '../../components/will/outputViews'
import { printDocument } from '../../components/will/printDocument'
import { generateWill } from '../../state/will/generateWill'
import { generateReviewSummary } from '../../state/will/generateReviewSummary'
import { externalPaths, willPaths } from '../../state/will/willPaths'

export function RouteBResultPage() {
  const active = useWillGuard()
  const { answers } = useWillState()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  if (!active) return null

  const willDocument = generateWill(answers, true)
  const summary = generateReviewSummary(answers)

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Take your will to a lawyer
        </h1>
      </div>
      <p className="page__text">We created a will and a summary of the points a lawyer needs to review.</p>
      <p className="page__text">
        Do not sign the will. Take both documents to a lawyer and make any changes they recommend.
      </p>

      <div className="govbb-btn-group">
        <button type="button" className="govbb-btn" onClick={() => printDocument('will-document')}>
          Print will for legal review
        </button>
        <button type="button" className="govbb-btn--secondary" onClick={() => printDocument('review-summary')}>
          Print review summary
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

      <WillDocumentView id="will-document" document={willDocument} offscreen />
      <ReviewSummaryView id="review-summary" document={summary} offscreen />
      <ClearMyAnswersLink />
    </div>
  )
}
