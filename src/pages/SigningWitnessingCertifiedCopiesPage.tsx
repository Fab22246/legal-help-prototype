import { Link } from 'react-router-dom'
import { GuidancePagePattern } from '../components/patterns/GuidancePagePattern'
import { RelevantLawSources } from '../components/RelevantLawSources'
import { getRouteByPath, getRouteNotices } from '../data/routes'

const ROUTE_PATH = '/signing-witnessing-certified-copies'

// Guidance page explaining common document terms. Plain-language information
// only — no legal advice, no checking/witnessing/certifying, no form or builder.
export function SigningWitnessingCertifiedCopiesPage() {
  const route = getRouteByPath(ROUTE_PATH)
  const notices = route
    ? getRouteNotices(route)
    : { draftWarning: false, legalReviewNeeded: true, relevantLaw: true }

  return (
    <GuidancePagePattern
      title="Understand signing, witnessing and certified copies"
      intro={
        <>
          <p className="page__text">
            Some documents must be signed, witnessed, sworn, certified or notarised before they can
            be used.
          </p>
          <p className="page__text">
            This page explains what these words usually mean. Check the instructions for your
            document because the rules may be different.
          </p>
        </>
      }
    >
      <section className="stack--tight">
        <h2 className="card-group__title">Signing a document</h2>
        <p className="page__text">Signing means adding your signature to a document.</p>
        <p className="page__text">
          Your signature may show that the information is yours, that you confirm it is correct or
          that you agree with what the document says.
        </p>
        <p className="page__text">
          Some documents must be signed in front of another person. Do not sign before meeting that
          person unless the instructions say you can.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Witnessing a signature</h2>
        <p className="page__text">A witness watches you sign a document.</p>
        <p className="page__text">
          The witness may also need to sign and add information such as their:
        </p>
        <ul className="govbb-list govbb-list--bullet">
          <li>full name</li>
          <li>address</li>
          <li>occupation</li>
          <li>date of signing</li>
        </ul>
        <p className="page__text">
          Check the document instructions before choosing a witness. Some documents say who can or
          cannot act as a witness.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Certified copies</h2>
        <p className="page__text">
          A certified copy is a copy that has been checked against the original document.
        </p>
        <p className="page__text">
          The person certifying it usually signs or stamps the copy to confirm that it matches the
          original.
        </p>
        <p className="page__text">You may need to show:</p>
        <ul className="govbb-list govbb-list--bullet">
          <li>the original document</li>
          <li>the copy that needs to be certified</li>
        </ul>
        <p className="page__text">
          The organisation asking for the copy may say who can certify it. Check with that
          organisation before getting the copy certified.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Sworn documents and affidavits</h2>
        <p className="page__text">
          An affidavit is a written statement that you swear or affirm is true.
        </p>
        <p className="page__text">
          You may need to swear or affirm it in front of a Justice of the Peace, notary public or
          another authorised person.
        </p>
        <p className="page__text">
          Check the instructions for the affidavit. If you are not sure what it should say, speak to
          a lawyer.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Notarising a document</h2>
        <p className="page__text">
          A notary public can witness some documents, confirm some signatures and issue notarial
          certificates.
        </p>
        <p className="page__text">
          You may need a notary for some court, business or overseas documents.
        </p>
        <p className="page__text">
          Check with the organisation asking for the document before having it notarised.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Apostille certificates</h2>
        <p className="page__text">
          An Apostille may help a Barbados public document be recognised in another country that
          accepts Apostilles under the Hague Convention.
        </p>
        <p className="page__text">
          Check with the organisation or country asking for the document before getting an Apostille.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Wills have special rules</h2>
        <p className="page__text">A will must be signed and witnessed in a particular way.</p>
        <p className="page__text">
          Do not ask someone who receives a gift in the will, or that person&rsquo;s spouse, to
          witness it. A gift to a witness or their spouse may not take effect.
        </p>
        <p className="page__text">
          If you are not sure who can witness a will, speak to a lawyer.
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Official services</h2>
        <ul className="govbb-list govbb-list--bullet">
          <li>
            <a
              className="govbb-link-default"
              href="https://www.barbadoslawcourts.gov.bb/useful-links/for-public/other-services-and-registrations/notarizing-documents-and-issuing-notarial-certificates"
            >
              Notarising documents and issuing notarial certificates
            </a>
          </li>
          <li>
            <a
              className="govbb-link-default"
              href="https://www.barbadoslawcourts.gov.bb/useful-links/for-public/other-services-and-registrations/issuing-apostille-certificates-under-the-hague-convention"
            >
              Issuing Apostille certificates under the Hague Convention
            </a>
          </li>
          <li>
            <a
              className="govbb-link-default"
              href="https://www.barbadoslawcourts.gov.bb/useful-links/for-public/how-to-order/certified-copies-of-recorded-documents"
            >
              Certified copies of recorded documents
            </a>
          </li>
        </ul>
      </section>

      {notices.relevantLaw ? (
        <RelevantLawSources
          explanation="The Succession Act includes rules about signing and witnessing wills and about gifts left to a witness or their spouse."
          sources={[
            {
              label: 'Succession Act, Cap. 249',
              href: 'https://www.barbadoslawcourts.gov.bb/assets/content/pdfs/statutes/SuccessionCAP249.pdf',
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
