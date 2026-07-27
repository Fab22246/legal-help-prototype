import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface SummaryRow {
  key: string
  value: ReactNode
}

export interface SummarySection {
  title: string
  /** Optional path for a "Change" link back to the relevant question page. */
  changeTo?: string
  rows: SummaryRow[]
}

interface CheckAnswersSummaryProps {
  sections: SummarySection[]
}

// "Check your answers" summary using the design system's summary list. Change
// links return the user to the relevant section. Structure only for now.
export function CheckAnswersSummary({ sections }: CheckAnswersSummaryProps) {
  return (
    <div className="stack">
      {sections.map((section) => (
        <section className="govbb-summary-section" key={section.title}>
          <h2 className="govbb-summary-section__title">{section.title}</h2>
          {section.changeTo ? (
            <Link className="govbb-summary-section__action" to={section.changeTo}>
              Change<span className="govbb-visually-hidden"> {section.title}</span>
            </Link>
          ) : null}
          <dl className="govbb-summary-list">
            {section.rows.map((row) => (
              <div className="govbb-summary-list__row" key={row.key}>
                <dt className="govbb-summary-list__key">{row.key}</dt>
                <dd className="govbb-summary-list__value">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
