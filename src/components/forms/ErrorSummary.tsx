import { forwardRef } from 'react'
import type { MouseEvent } from 'react'

export interface ErrorSummaryItem {
  /** DOM id of the field the error belongs to (no leading #). */
  fieldId: string
  /** The error message shown in the summary and beside the field. */
  message: string
}

interface ErrorSummaryProps {
  items: ErrorSummaryItem[]
  title?: string
}

function handleLinkClick(event: MouseEvent<HTMLAnchorElement>, fieldId: string) {
  // HashRouter uses the URL hash for routing, so a native href="#fieldId"
  // click would change the route (matching the field id as a path) instead
  // of scrolling to and focusing the field. Intercept and focus the field
  // ourselves, matching gov.uk error-summary behaviour without touching
  // window.location.
  event.preventDefault()
  const target = document.getElementById(fieldId)
  if (!target) return
  target.focus({ preventScroll: true })
  target.scrollIntoView({ block: 'center', behavior: 'auto' })
}

// Accessible error summary shown at the top of a form after validation fails.
// Focus is moved to it by the calling page. Each item is a link to the
// affected field so keyboard users can jump straight to fix it.
export const ErrorSummary = forwardRef<HTMLDivElement, ErrorSummaryProps>(function ErrorSummary(
  { items, title = 'There is a problem' },
  ref,
) {
  if (items.length === 0) return null

  return (
    <div
      className="govbb-error-summary"
      role="alert"
      aria-labelledby="error-summary-title"
      tabIndex={-1}
      ref={ref}
    >
      <h2 className="govbb-error-summary__title" id="error-summary-title">
        {title}
      </h2>
      <ul className="govbb-error-summary__list">
        {items.map((item) => (
          <li key={item.fieldId}>
            <a
              className="govbb-error-summary__link"
              href={`#${item.fieldId}`}
              onClick={(event) => handleLinkClick(event, item.fieldId)}
            >
              {item.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
})
