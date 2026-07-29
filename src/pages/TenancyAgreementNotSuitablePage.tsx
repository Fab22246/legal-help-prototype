import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'

// Safe-exit page for the tenancy-agreement builder. Reached when scope answers
// fall outside what the builder can help with. Does not describe the user as
// eligible or ineligible; does not classify the arrangement legally. The
// global StatusBanner carries the prototype / not-live / general legal-advice
// boundary.
export function TenancyAgreementNotSuitablePage() {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement/scope">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          You cannot prepare this agreement here
        </h1>
      </div>

      <section className="stack--tight">
        <p className="page__text">
          You can prepare an agreement here only for a new tenancy in Barbados before it starts.
        </p>
        <p className="page__text">You cannot use these questions for:</p>
        <ul className="govbb-list govbb-list--bullet">
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
        <h2 className="card-group__title">What you can do next</h2>
        <ul className="govbb-list govbb-list--bullet">
          <li>
            <Link className="govbb-link-default" to="/prepare-for-lawyer">
              Prepare information before speaking to a lawyer
            </Link>
          </li>
          <li>
            <Link className="govbb-link-default" to="/renting-home">
              Understand renting a home
            </Link>
          </li>
        </ul>
      </section>

      <p className="page__text">
        <Link className="govbb-link-default" to="/">
          Back to what you need help with
        </Link>
      </p>
    </div>
  )
}
