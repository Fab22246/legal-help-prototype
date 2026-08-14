import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWillState } from '../../state/will/WillState'
import { useConfirmedOutput } from '../../components/will/useConfirmedOutput'
import { ClearMyAnswersLink } from '../../components/will/WillPage'
import { WillDocumentView } from '../../components/will/outputViews'
import { printDocument } from '../../components/will/printDocument'
import { generateWill } from '../../state/will/generateWill'
import { willPaths } from '../../state/will/willPaths'

export function RouteASigningPage() {
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
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Sign and witness your will
        </h1>
      </div>
      <p className="page__text">Your will is not valid until it has been signed and witnessed correctly.</p>
      <p className="page__text">Choose 2 witnesses who:</p>
      <ul className="govbb-list govbb-list--bullet">
        <li>are both present when you sign</li>
        <li>do not receive anything in your will</li>
        <li>are not married to anyone who receives anything in your will</li>
      </ul>

      <h2 className="card-group__title">Sign the will</h2>
      <ol className="govbb-list govbb-list--number">
        <li>Have both witnesses with you at the same time.</li>
        <li>Sign the will while both witnesses watch.</li>
        <li>Ask each witness to sign while you watch.</li>
        <li>Ask each witness to enter their full name, address, occupation and the date.</li>
      </ol>
      <p className="page__text">Do not sign an electronic copy. Print the will and sign the paper copy.</p>
      <p className="page__text">
        Do not write changes on the printed will. If you need to change something, change your answers and print the
        will again before signing.
      </p>

      <div className="govbb-btn-group">
        <button type="button" className="govbb-btn" onClick={() => navigate(willPaths.safekeeping)}>
          Continue to safekeeping
        </button>
      </div>
      <p className="page__text">
        <button type="button" className="govbb-btn--link" onClick={() => printDocument('will-document')}>
          Print my will again
        </button>
      </p>

      <WillDocumentView id="will-document" document={document} offscreen />
      <ClearMyAnswersLink />
    </div>
  )
}
