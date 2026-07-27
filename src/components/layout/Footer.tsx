import { LEGAL_BOUNDARY } from '../../data/content'

// Uses the design system's footer component (govbb-footer) for a native GovTech
// look, but without the coat of arms / official crest. States prototype status.
export function Footer() {
  return (
    <footer className="govbb-footer">
      <div className="govbb-footer__inner app-container">
        <div className="govbb-footer__end">
          <p className="govbb-footer__copy">
            <strong>This is a personal prototype.</strong> It is not a live government service.
          </p>
          <p className="govbb-footer__copy">{LEGAL_BOUNDARY}</p>
        </div>
      </div>
    </footer>
  )
}
