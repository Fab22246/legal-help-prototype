import type { ReactNode } from 'react'
import { BackLink } from '../navigation/BackLink'
import { PrototypeNotice } from '../PrototypeNotice'

interface SupportPagePatternProps {
  title: string
  intro?: ReactNode
  /** Signposting / main content. */
  children?: ReactNode
  /** Preparation checklist items. */
  checklist?: string[]
  checklistTitle?: string
  /** Future contact or support information. */
  support?: ReactNode
  backTo?: string
  backLabel?: string
}

// Structural pattern for a support route (signposting + preparation). Scaffold
// only — it must not make an eligibility decision.
export function SupportPagePattern({
  title,
  intro,
  children,
  checklist,
  checklistTitle = 'What to prepare',
  support,
  backTo = '/',
  backLabel = 'Back',
}: SupportPagePatternProps) {
  return (
    <div className="page">
      <BackLink to={backTo}>{backLabel}</BackLink>
      <div className="page__header">
        <h1 className="page__title">{title}</h1>
        {intro}
      </div>

      <PrototypeNotice />

      {children}

      {checklist && checklist.length > 0 ? (
        <section className="stack--tight">
          <h2 className="card-group__title">{checklistTitle}</h2>
          <ul>
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {support ? (
        <section className="stack--tight">
          <h2 className="card-group__title">Getting support</h2>
          {support}
        </section>
      ) : null}
    </div>
  )
}
