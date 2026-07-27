import { Link } from 'react-router-dom'
import { SERVICE_NAME } from '../../data/content'

// Uses the design system's header component (govbb-header) for a native GovTech
// look, but with a plain text wordmark — no official logo, crest or the
// "Official Government of Barbados website" banner. This is a prototype and must
// not imply an approved live government service.
export function Header() {
  return (
    <header className="govbb-header">
      <div className="govbb-header__inner app-container">
        <Link className="app-header__title" to="/">
          {SERVICE_NAME}
        </Link>
        <span className="app-header__tag">Prototype</span>
      </div>
    </header>
  )
}
