import { Link } from 'react-router-dom'
import { GuidancePagePattern } from '../components/patterns/GuidancePagePattern'
import { RelevantLawSources } from '../components/RelevantLawSources'
import { getRouteByPath, getRouteNotices } from '../data/routes'

const ROUTE_PATH = '/give-property'

// Guidance page: helps someone prepare before speaking to a lawyer about giving
// land or a home away while alive. Plain-language preparation only — it must not
// give legal advice, decide ownership, transfer or record property, generate a
// document, or state that any gift is valid, reversible or complete.
export function GivePropertyPage() {
  const route = getRouteByPath(ROUTE_PATH)
  const notices = route
    ? getRouteNotices(route)
    : { draftWarning: false, legalReviewNeeded: true, relevantLaw: true }

  return (
    <GuidancePagePattern
      title="Give land or a home while I am alive"
      intro={
        <>
          <p className="page__text">
            Giving land or a home to someone while you are alive can affect who owns it and what you
            can do with it afterwards.
          </p>
          <p className="page__text">
            This page helps you prepare before you speak to a lawyer. It does not transfer the
            property or prepare a legal document.
          </p>
        </>
      }
    >
      <section className="stack--tight">
        <h2 className="card-group__title">Before you decide</h2>
        <p className="page__text">
          Giving land while you are alive is different from leaving it to someone in a will. Giving
          it while you are alive may change who owns it before you die.
        </p>
        <p className="page__text">
          Before you decide, think about whether you want to keep living in or using the property.
          Ask a lawyer how the transfer could affect you and the person receiving it.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">What to prepare</h2>
        <p className="page__text">Write down:</p>
        <ul className="govbb-list govbb-list--bullet">
          <li>what you want to give and its location or address</li>
          <li>whose name the land or home is in</li>
          <li>whether anyone else owns part of it</li>
          <li>whether a mortgage or another person&rsquo;s rights may affect it</li>
          <li>who you want to give it to</li>
          <li>whether you want to keep living there or using it</li>
        </ul>
        <p className="page__text">
          Gather any information or documents you already have, such as:
        </p>
        <ul className="govbb-list govbb-list--bullet">
          <li>the most recent land tax bill</li>
          <li>a deed, certificate of title or other ownership document</li>
          <li>information about any mortgage</li>
        </ul>
        <p className="page__text">
          These are preparation prompts. They are not a complete list of legal requirements.
        </p>
        <p className="page__text">
          A lawyer can help you find out what documents and steps may be needed.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">How a transfer is recorded</h2>
        <p className="page__text">
          The Land Registry records ownership in different ways. This can affect how a transfer is
          recorded or registered.
        </p>
        <p className="page__text">
          The{' '}
          <a
            className="govbb-link-default"
            href="https://landregistry.gov.bb/wp-content/uploads/2022/06/Conducting-Business-at-the-Land-Registry.pdf"
          >
            Land Registry&rsquo;s guidance
          </a>{' '}
          includes information about deeds of gift, Property Transfer Tax and recording or
          registering documents. Ask a lawyer which process applies before preparing or signing
          anything.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Questions to ask</h2>
        <p className="page__text">You may want to ask:</p>
        <ul className="govbb-list govbb-list--bullet">
          <li>what type of document is needed</li>
          <li>when ownership would change</li>
          <li>whether anyone else must agree</li>
          <li>whether you can continue living in or using the property</li>
          <li>whether the transfer can be changed or reversed</li>
          <li>how the transfer could affect your will or estate</li>
          <li>whether tax, stamp duty, legal fees or registration fees may apply</li>
          <li>what must be recorded or registered</li>
        </ul>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Prepare before speaking to a lawyer</h2>
        <p className="page__text">
          Use the lawyer-preparation guidance to organise the property information, important
          documents and questions you want to ask.
        </p>
        <p className="page__text">
          <Link className="govbb-link-default" to="/prepare-for-lawyer">
            Prepare information before speaking to a lawyer
          </Link>
        </p>
      </section>

      {notices.relevantLaw ? (
        <RelevantLawSources
          explanation="The Land Registration Act, Cap. 229 covers registered land, transfers and recording documents concerning unregistered land. The Property Act, Cap. 236 contains wider law about property, transferring property and legal documents. The Land Tax Act, Cap. 78A contains provisions connected with land tax and transferring land."
          sources={[
            {
              label: 'Land Registration Act, Cap. 229',
              href: 'https://www.barbadoslawcourts.gov.bb/assets/content/pdfs/statutes/LandRegistrationCAP229.pdf',
            },
            {
              label: 'Property Act, Cap. 236',
              href: 'https://www.barbadoslawcourts.gov.bb/assets/content/pdfs/statutes/PropertyCAP236.pdf',
            },
            {
              label: 'Land Tax Act, Cap. 78A',
              href: 'https://www.barbadoslawcourts.gov.bb/assets/content/pdfs/statutes/LandTaxCAP078A.pdf',
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
