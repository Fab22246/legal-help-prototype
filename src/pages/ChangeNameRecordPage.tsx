import { Link } from 'react-router-dom'
import { GuidancePagePattern } from '../components/patterns/GuidancePagePattern'
import { RelevantLawSources } from '../components/RelevantLawSources'
import { getRouteByPath, getRouteNotices } from '../data/routes'

const ROUTE_PATH = '/change-name-record'

// Guidance page: where to start when changing a name, correcting a birth
// certificate error, or updating records after a name change. Plain-language
// information only — it must not decide which process applies or give advice.
export function ChangeNameRecordPage() {
  const route = getRouteByPath(ROUTE_PATH)
  const notices = route
    ? getRouteNotices(route)
    : { draftWarning: false, legalReviewNeeded: true, relevantLaw: true }

  return (
    <GuidancePagePattern
      title="Change a name or update a record"
      intro={
        <p className="page__text">
          Use this page to find out where to start if you want to change your name, correct a mistake
          on a birth certificate, or update your records after a name change.
        </p>
      }
    >
      <section className="stack--tight">
        <h2 className="card-group__title">Changing your name</h2>
        <p className="page__text">
          Changing your name is different from correcting information that was recorded incorrectly.
        </p>
        <p className="page__text">
          The Barbados Judicial System provides a process for applying to change your name.
        </p>
        <p className="page__text">To apply, you need:</p>
        <ul className="govbb-list govbb-list--bullet">
          <li>an application for the change of name</li>
          <li>a sworn affidavit that supports the application</li>
          <li>your birth certificate</li>
          <li>identification</li>
          <li>consent from a parent in some circumstances</li>
        </ul>
        <p className="page__text">
          A sworn affidavit is a written statement that you swear or affirm is true. You usually
          swear or affirm it in front of a person who is allowed to take oaths.
        </p>
        <p className="page__text">
          The cost of a change of name is BDS $200. You cannot pay here.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Correcting an error on a birth certificate</h2>
        <p className="page__text">
          Correcting an error on a birth certificate is not the same as changing your name.
        </p>
        <p className="page__text">
          A correction fixes a mistake in the information recorded on a birth certificate.
        </p>
        <p className="page__text">To ask for a correction, you need:</p>
        <ul className="govbb-list govbb-list--bullet">
          <li>the birth certificate that has the error</li>
          <li>identification for the person asking for the correction</li>
          <li>a sworn affidavit explaining the correction</li>
        </ul>
        <p className="page__text">
          This process is for birth certificates. It may not apply to other certificates or records.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Updating other records</h2>
        <p className="page__text">
          After your name is changed, records held by other organisations may not update
          automatically.
        </p>
        <p className="page__text">
          You may need to contact each organisation that still holds your information in your previous
          name.
        </p>
        <p className="page__text">
          This may include your identification and records held by banks, employers or other service
          providers.
        </p>
        <p className="page__text">You cannot update records here.</p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">When to speak to a lawyer</h2>
        <p className="page__text">You may need to speak to a lawyer if:</p>
        <ul className="govbb-list govbb-list--bullet">
          <li>there is a dispute about the name or record</li>
          <li>you are worried about fraud or false information</li>
          <li>a court matter is involved</li>
          <li>you are not sure which process applies</li>
        </ul>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Official pages</h2>
        <ul className="govbb-list govbb-list--bullet">
          <li>
            <a
              className="govbb-link-default"
              href="https://www.barbadoslawcourts.gov.bb/useful-links/for-public/services/change-of-names"
            >
              Change of Names
            </a>
          </li>
          <li>
            <a
              className="govbb-link-default"
              href="https://www.barbadoslawcourts.gov.bb/useful-links/for-public/services/correcting-errors-on-certificates"
            >
              Correcting errors on certificates
            </a>
          </li>
          <li>
            <a
              className="govbb-link-default"
              href="https://www.barbadoslawcourts.gov.bb/useful-links/for-public/application-forms/"
            >
              Application Forms
            </a>
          </li>
        </ul>
      </section>

      {notices.relevantLaw ? (
        <RelevantLawSources
          explanation="The Change of Name Act, Cap. 212A contains rules about registered changes of name in Barbados."
          sources={[
            {
              label: 'Change of Name Act, Cap. 212A',
              href: 'https://www.barbadoslawcourts.gov.bb/assets/content/pdfs/statutes/ChangeofNameCAP212A.pdf',
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
