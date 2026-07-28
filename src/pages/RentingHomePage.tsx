import { Link } from 'react-router-dom'
import { GuidancePagePattern } from '../components/patterns/GuidancePagePattern'
import { RelevantLawSources } from '../components/RelevantLawSources'
import { getRouteByPath, getRouteNotices } from '../data/routes'

const ROUTE_PATH = '/renting-home'

// Guidance page: understanding a tenancy agreement and what to check before
// agreeing to or signing one. Plain-language information only — it must not give
// legal advice, decide any dispute, or prepare, check, sign or register an
// agreement. The tenancy builder is not part of this page.
export function RentingHomePage() {
  const route = getRouteByPath(ROUTE_PATH)
  const notices = route
    ? getRouteNotices(route)
    : { legalAdviceBoundary: true, draftWarning: false, legalReviewNeeded: true, relevantLaw: true }

  return (
    <GuidancePagePattern
      title="Renting a home"
      showLegalAdviceBoundary={notices.legalAdviceBoundary}
      intro={
        <>
          <p className="page__text">
            A tenancy agreement records what a landlord and tenant agree about renting a home.
          </p>
          <p className="page__text">
            The landlord rents out the home. The tenant pays rent to live there.
          </p>
          <p className="page__text">
            Read the agreement and make sure you understand it before you sign it.
          </p>
        </>
      }
    >
      <section className="stack--tight">
        <h2 className="card-group__title">What to check before agreeing to rent</h2>
        <p className="page__text">
          It helps to read the agreement and check what it says before you agree to rent. You can
          check:
        </p>
        <ul>
          <li>the landlord&rsquo;s and tenant&rsquo;s names</li>
          <li>the address of the home</li>
          <li>when the tenancy starts</li>
          <li>whether an end date is stated</li>
          <li>how much rent is due</li>
          <li>when and how rent should be paid</li>
          <li>any deposit stated in the agreement</li>
          <li>which services or bills each person is expected to pay</li>
          <li>who is expected to arrange or pay for repairs</li>
          <li>any rules about using the home</li>
          <li>what the agreement says about ending the tenancy</li>
        </ul>
        <p className="page__text">
          Every agreement is different. Not every agreement includes all of these.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Before signing</h2>
        <p className="page__text">Before you sign, you can:</p>
        <ul>
          <li>ask about any wording you do not understand</li>
          <li>check that any changes you agreed with the landlord appear in the agreement</li>
          <li>check the condition of the home</li>
          <li>write down any existing damage or problems</li>
          <li>keep a copy of the signed agreement</li>
          <li>keep records of rent and other payments</li>
        </ul>
        <p className="page__text">
          If there is no written agreement, you may need legal advice if you are not sure what was
          agreed.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">When to speak to a lawyer</h2>
        <p className="page__text">You may need to speak to a lawyer if:</p>
        <ul>
          <li>you disagree about rent, a deposit, repairs or damage</li>
          <li>you are being asked to leave</li>
          <li>you do not understand a notice or court document</li>
          <li>you are not sure whether an agreement or legal rule applies to you</li>
        </ul>
      </section>

      {notices.relevantLaw ? (
        <RelevantLawSources
          explanation="The Landlord and Tenant Act, Cap. 230 contains rules relating to landlords and tenants. The Landlord and Tenant (Registration of Tenancies) Act, Cap. 230A concerns the registration of rented premises."
          sources={[
            {
              label: 'Landlord and Tenant Act, Cap. 230',
              href: 'https://www.barbadoslawcourts.gov.bb/assets/content/pdfs/statutes/LandlordandTenantCAP230.pdf',
            },
            {
              label: 'Landlord and Tenant (Registration of Tenancies) Act, Cap. 230A',
              href: 'https://www.barbadoslawcourts.gov.bb/assets/content/pdfs/statutes/LandlordandTenant%28RegistrationofTenancies%29CAP230A.pdf',
            },
          ]}
        />
      ) : null}

      <p className="page__text">
        <Link className="govbb-link-default" to="/">
          Back to what you need help with
        </Link>
      </p>
    </GuidancePagePattern>
  )
}
