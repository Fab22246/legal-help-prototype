import { Link } from 'react-router-dom'
import { SERVICE_NAME } from '../../data/content'

// Uses the design system's header component (govbb-header) for a native GovTech
// look, but with a plain text wordmark — no official logo, crest or the
// "Official Government of Barbados website" banner. The global StatusBanner
// below carries the prototype / not-live / legal-advice boundary.
export function Header() {
  return (
    <header className="govbb-header">
      <div className="govbb-header__inner app-container">
        <Link className="app-header__title" to="/">
          {SERVICE_NAME}
        </Link>
      </div>
    </header>
  )
}
