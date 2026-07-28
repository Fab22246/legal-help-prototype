import { Link } from 'react-router-dom'
import { SupportPagePattern } from '../components/patterns/SupportPagePattern'
import { RelevantLawSources } from '../components/RelevantLawSources'
import { getRouteByPath, getRouteNotices } from '../data/routes'

const ROUTE_PATH = '/legal-aid'

// Support page: explains that legal aid may be worth asking about if someone is
// worried about the cost of a lawyer, and shows how to contact Community Legal
// Services. Plain-language information only — it must not decide eligibility,
// ask eligibility questions, promise help, call the service free, or collect,
// store or send any personal information.
export function LegalAidPage() {
  const route = getRouteByPath(ROUTE_PATH)
  const notices = route
    ? getRouteNotices(route)
    : { legalAdviceBoundary: true, draftWarning: false, legalReviewNeeded: true, relevantLaw: true }

  return (
    <SupportPagePattern
      title="Ask about legal aid"
      showLegalAdviceBoundary={notices.legalAdviceBoundary}
      intro={
        <>
          <p className="page__text">Use this page to find out about legal aid and how to ask about it.</p>
          <p className="page__text">
            Legal aid may be worth asking about if you are worried about the cost of a lawyer.
          </p>
        </>
      }
    >
      <section className="stack--tight">
        <h2 className="card-group__title">What legal aid is</h2>
        <p className="page__text">
          Community Legal Services provides legal help for people who may not be able to pay for a
          lawyer themselves.
        </p>
        <p className="page__text">
          Legal aid may be available for some criminal cases and some other legal matters.
        </p>
        <p className="page__text">
          Community Legal Services will tell you whether your type of matter may be covered.
        </p>
        <p className="page__text">In some cases, you may be asked to pay part of the cost.</p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Who decides</h2>
        <p className="page__text">
          Community Legal Services looks at your situation and decides whether it can help you. This
          prototype does not decide.
        </p>
        <p className="page__text">Contacting the office does not mean legal aid will be provided.</p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">How to ask about legal aid</h2>
        <p className="page__text">
          You can contact Community Legal Services to ask for information or to arrange an interview.
        </p>
        <p className="page__text">
          Telephone:{' '}
          <a className="govbb-link-default" href="tel:535-9900">
            535-9900
          </a>
        </p>
        <p className="page__text">
          Email:{' '}
          <a className="govbb-link-default" href="mailto:legal.aid@barbados.gov.bb">
            legal.aid@barbados.gov.bb
          </a>
        </p>
        <p className="page__text">The official page asks you to email your contact details.</p>
        <p className="page__text">
          You can also read the official legal aid information on the{' '}
          <a className="govbb-link-default" href="https://oag.gov.bb/help">
            Attorney General&rsquo;s Office website
          </a>
          .
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Before you contact the office</h2>
        <p className="page__text">Before you contact the office, you can:</p>
        <ul className="govbb-list govbb-list--bullet">
          <li>write a short description of your matter for your own notes</li>
          <li>note any important dates</li>
          <li>have your contact details ready</li>
        </ul>
        <p className="page__text">
          When you contact the office, ask what information or documents it needs.
        </p>
      </section>

      {notices.relevantLaw ? (
        <RelevantLawSources
          explanation="The Community Legal Services Act, Cap. 112A sets out how legal services may be provided to people who cannot afford them. It also allows some applicants to be asked to pay part of the cost."
          sources={[
            {
              label: 'Community Legal Services Act, Cap. 112A',
              href: 'https://www.barbadoslawcourts.gov.bb/assets/content/pdfs/statutes/CommunityLegalServicesCAP112A.pdf',
            },
          ]}
        />
      ) : null}

      <p className="page__text">
        <Link className="govbb-link-default" to="/">
          Back to what you need help with
        </Link>
      </p>
    </SupportPagePattern>
  )
}
