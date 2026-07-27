// Persistent prototype-status strip using the design system's status-banner
// component. Keeps it clear on every page that this is a prototype, not a live
// government service.
export function StatusBanner() {
  return (
    <div className="govbb-status-banner govbb-status-banner--alpha" role="status">
      <div className="app-container">
        <p>
          <strong>Prototype.</strong> This is a personal side-project, not a live government service.
          It does not give legal advice.
        </p>
      </div>
    </div>
  )
}
