import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWillState } from '../../state/will/WillState'
import { useConfirmedOutput } from '../../components/will/useConfirmedOutput'
import { ClearMyAnswersLink } from '../../components/will/WillPage'
import { WillDocumentView } from '../../components/will/outputViews'
import { printDocument } from '../../components/will/printDocument'
import { generateWill } from '../../state/will/generateWill'
import { willPaths } from '../../state/will/willPaths'

export function RouteAResultPage() {
  const ready = useConfirmedOutput('A')
  const { answers } = useWillState()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  if (!ready) return null

  const document = generateWill(answers, false)

  return (
    <div className="page">
      <div className="page__header will-no-print">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Your will is ready to print
        </h1>
      </div>
      <div className="will-no-print">
        <p className="page__text">
          Your will is not valid yet. You must print it, sign it and have 2 witnesses sign it.
        </p>
        <p className="page__text">
          Review the will before you print it. If anything is wrong, change your answers and create it again.
        </p>
      </div>

      <WillDocumentView id="will-document" document={document} />

      <div className="govbb-btn-group will-no-print">
        <button type="button" className="govbb-btn" onClick={() => printDocument('will-document')}>
          Print my will
        </button>
        <button type="button" className="govbb-btn--secondary" onClick={() => navigate(willPaths.signing)}>
          Continue to signing
        </button>
      </div>
      <p className="page__text will-no-print">
        <button type="button" className="govbb-btn--link" onClick={() => navigate(willPaths.checkYourAnswers)}>
          Change my answers
        </button>
      </p>
      <ClearMyAnswersLink />
    </div>
  )
}
