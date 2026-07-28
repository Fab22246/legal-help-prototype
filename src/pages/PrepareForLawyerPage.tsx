import { Link } from 'react-router-dom'
import { SupportPagePattern } from '../components/patterns/SupportPagePattern'
import { getRouteByPath, getRouteNotices } from '../data/routes'

const ROUTE_PATH = '/prepare-for-lawyer'

// Support page: helps someone organise useful information, dates, documents and
// questions before speaking to a lawyer. Plain-language preparation only — it
// must not give legal advice, assess the case, find or recommend a lawyer, book
// an appointment, or collect, store or send any information.
export function PrepareForLawyerPage() {
  const route = getRouteByPath(ROUTE_PATH)
  const notices = route
    ? getRouteNotices(route)
    : { legalAdviceBoundary: true, draftWarning: false, legalReviewNeeded: false, relevantLaw: false }

  return (
    <SupportPagePattern
      title="Prepare information before speaking to a lawyer"
      showLegalAdviceBoundary={notices.legalAdviceBoundary}
      intro={
        <>
          <p className="page__text">Use this page to get ready before you speak to a lawyer.</p>
          <p className="page__text">
            You can make notes, gather documents and write down your questions.
          </p>
        </>
      }
    >
      <section className="stack--tight">
        <h2 className="card-group__title">Write down what happened</h2>
        <p className="page__text">Make notes about your problem. It can help to write down:</p>
        <ul>
          <li>what happened</li>
          <li>important dates</li>
          <li>who was involved</li>
          <li>what each person or organisation did</li>
          <li>what has happened since</li>
          <li>any deadline or date you already know about</li>
        </ul>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Gather useful documents</h2>
        <p className="page__text">
          Collect any documents that relate to your problem. These may include:
        </p>
        <ul>
          <li>agreements or contracts</li>
          <li>letters, emails or messages</li>
          <li>notices or court documents</li>
          <li>receipts or payment records</li>
          <li>identification or official records</li>
          <li>photographs or other records connected to the problem</li>
        </ul>
        <p className="page__text">
          The documents that help depend on your problem. This is not a fixed list. You may not have
          all of these, and you may have others.
        </p>
        <p className="page__text">Keep your documents together so you have them ready.</p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">Write down your questions</h2>
        <p className="page__text">Think about what you want to ask. You could ask:</p>
        <ul>
          <li>What are my options?</li>
          <li>What information do you need from me?</li>
          <li>Is there anything I need to do by a particular date?</li>
          <li>What could happen next?</li>
          <li>What costs should I ask about?</li>
        </ul>
        <p className="page__text">Use these questions as a starting point.</p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">If you are worried about the cost of a lawyer</h2>
        <p className="page__text">
          You can find out how to ask Community Legal Services about legal aid.
        </p>
        <p className="page__text">
          <Link className="govbb-link-default" to="/legal-aid">
            Ask about legal aid
          </Link>
        </p>
      </section>

      <section className="stack--tight">
        <h2 className="card-group__title">What this prototype cannot do</h2>
        <p className="page__text">This prototype:</p>
        <ul>
          <li>does not look at your situation and explain your options</li>
          <li>does not tell you what to do</li>
          <li>does not contact or recommend a lawyer</li>
          <li>does not book an appointment</li>
          <li>does not store or send your information</li>
        </ul>
      </section>

      <p className="page__text">
        <Link className="govbb-link-default" to="/">
          Back to what you need help with
        </Link>
      </p>
    </SupportPagePattern>
  )
}
