import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ButtonLink } from '../components/navigation/ButtonLink'
import { Notice } from '../components/Notice'
import { getRouteByPath, getRouteNotices } from '../data/routes'

const ROUTE_PATH = '/renting-home/agreement'

// Start page for the tenancy-agreement builder. Not a form — orients the
// landlord and tenant to what the builder does, what they will need, and what
// it does not do. The "Important" section carries the legal-advice and
// unreviewed-draft boundaries so the scope page does not repeat them.
export function TenancyAgreementStartPage() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const route = getRouteByPath(ROUTE_PATH)
  const notices = route
    ? getRouteNotices(route)
    : { legalAdviceBoundary: false, draftWarning: false, legalReviewNeeded: true, relevantLaw: false }

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="page">
      <BackLink to="/renting-home">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Prepare a draft tenancy agreement
        </h1>
        <p className="page__text">
          Use this builder to prepare a draft agreement for renting a home in Barbados.
        </p>
        <p className="page__text">
          The landlord and tenant should discuss the terms before using the builder.
        </p>
      </div>

      {notices.legalAdviceBoundary ? <Notice kind="legal-advice" /> : null}

      <section className="stack--tight">
        <h2 className="card-group__title">What you can do</h2>
        <p className="page__text">You can:</p>
        <ul>
          <li>record who the agreement is between</li>
          <li>describe the home being rented</li>
          <li>record the rent, deposit and bills</li>
          <li>add agreed responsibilities and restrictions</li>
          <li>check the information before creating a draft</li>
        </ul>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Before you start</h2>
        <p className="page__text">You will need:</p>
        <ul>
          <li>the landlord&rsquo;s and tenant&rsquo;s full names</li>
          <li>the address of the home</li>
          <li>the agreed start date</li>
          <li>the rent, payment date and payment method</li>
          <li>information about any deposit</li>
          <li>details of bills, furniture and other agreed terms</li>
        </ul>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Important</h2>
        <p className="page__text">
          The draft is not legal advice and has not been legally reviewed. Creating it does not sign,
          send or register the agreement.
        </p>
        <p className="page__text">
          Every landlord and tenant should check the draft carefully. They may wish to speak to a
          lawyer before signing it.
        </p>
      </section>

      <div className="govbb-btn-group">
        <ButtonLink to="/renting-home/agreement/scope">Start now</ButtonLink>
      </div>

      <p className="page__text">
        <Link className="govbb-link-default" to="/renting-home">
          Understand renting a home
        </Link>
      </p>
    </div>
  )
}
