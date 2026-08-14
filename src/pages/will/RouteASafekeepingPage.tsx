import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWillState } from '../../state/will/WillState'
import { useConfirmedOutput } from '../../components/will/useConfirmedOutput'
import { ClearMyAnswersLink } from '../../components/will/WillPage'
import { externalPaths } from '../../state/will/willPaths'

const SAFEKEEPING_LINK =
  'https://www.barbadoslawcourts.gov.bb/useful-links/for-public/services/safekeeping-of-wills-of-living-persons'

export function RouteASafekeepingPage() {
  const ready = useConfirmedOutput('A')
  const { clearAll } = useWillState()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  if (!ready) return null

  function finish() {
    clearAll()
    navigate(externalPaths.home)
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Keep your will safe
        </h1>
      </div>
      <p className="page__text">Keep the signed original in a safe place. Tell your executors where it is kept.</p>
      <p className="page__text">
        The Records Branch accepts original wills for safekeeping. Put the original will in a sealed envelope and write
        these details on the front:
      </p>
      <ul className="govbb-list govbb-list--bullet">
        <li>the date of the will</li>
        <li>your name and address</li>
        <li>the names and addresses of your executors</li>
      </ul>
      <p className="page__text">
        <a className="govbb-link-default" href={SAFEKEEPING_LINK}>
          Find out how to lodge a will for safekeeping
        </a>
      </p>

      <h2 className="card-group__title">If your circumstances change</h2>
      <p className="page__text">
        Get legal advice if your wishes or circumstances change, including if you marry after signing the will.
      </p>

      <div className="govbb-btn-group">
        <button type="button" className="govbb-btn" onClick={finish}>
          Finish and clear my answers
        </button>
      </div>
      <ClearMyAnswersLink />
    </div>
  )
}
