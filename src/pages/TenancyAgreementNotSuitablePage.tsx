import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { Notice } from '../components/Notice'
import { getRouteByPath, getRouteNotices } from '../data/routes'

const ROUTE_PATH = '/renting-home/agreement/not-suitable'

// Safe-exit page for the tenancy-agreement builder. Reached when scope answers
// fall outside what the builder can help with. Does not describe the user as
// eligible or ineligible; does not classify the arrangement legally.
export function TenancyAgreementNotSuitablePage() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const route = getRouteByPath(ROUTE_PATH)
  const notices = route
    ? getRouteNotices(route)
    : { legalAdviceBoundary: true, draftWarning: false, legalReviewNeeded: true, relevantLaw: false }

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement/scope">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          This builder cannot help with this agreement
        </h1>
      </div>

      {notices.legalAdviceBoundary ? <Notice kind="legal-advice" /> : null}

      <section className="stack--tight">
        <p className="page__text">
          This builder is for a new agreement to rent a home in Barbados before the tenancy starts.
        </p>
        <p className="page__text">It cannot help with:</p>
        <ul>
          <li>a room shared with the landlord</li>
          <li>business premises or land only</li>
          <li>a home that will not be used only as a private home</li>
          <li>changing an agreement that has already started</li>
          <li>a disagreement</li>
          <li>someone being asked to leave</li>
        </ul>
        <p className="page__text">
          These situations can affect the rights of the people involved. You may wish to speak to a
          lawyer before taking action.
        </p>
      </section>

      <section className="stack--tight">
        <p className="page__text">
          <Link className="govbb-link-default" to="/prepare-for-lawyer">
            Prepare information before speaking to a lawyer
          </Link>
        </p>
        <p className="page__text">
          <Link className="govbb-link-default" to="/renting-home">
            Understand renting a home
          </Link>
        </p>
        <p className="page__text">
          <Link className="govbb-link-default" to="/">
            Back to what you need help with
          </Link>
        </p>
      </section>
    </div>
  )
}
