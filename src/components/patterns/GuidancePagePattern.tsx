import type { ReactNode } from 'react'
import { BackLink } from '../navigation/BackLink'
import { PrototypeNotice } from '../PrototypeNotice'
import { Notice } from '../Notice'
import { RelevantLawSources, type LawSource } from '../RelevantLawSources'

interface GuidancePagePatternProps {
  title: string
  intro?: ReactNode
  /** Main guidance content. */
  children?: ReactNode
  /** "What you can do next" content. */
  whatNext?: ReactNode
  /** "What this prototype cannot do" content. */
  whatPrototypeCannotDo?: ReactNode
  /** Show the relevant-law section. */
  showRelevantLaw?: boolean
  lawExplanation?: string
  lawSources?: LawSource[]
  backTo?: string
  backLabel?: string
}

// Structural pattern for a guidance route. Scaffold only — no legal content and
// it must never promise a legal result. Pages populate the slots later.
export function GuidancePagePattern({
  title,
  intro,
  children,
  whatNext,
  whatPrototypeCannotDo,
  showRelevantLaw = false,
  lawExplanation,
  lawSources,
  backTo = '/',
  backLabel = 'Back',
}: GuidancePagePatternProps) {
  return (
    <div className="page">
      <BackLink to={backTo}>{backLabel}</BackLink>
      <div className="page__header">
        <h1 className="page__title">{title}</h1>
        {intro}
      </div>

      <PrototypeNotice />
      <Notice kind="legal-advice" />

      {children}

      {whatNext ? (
        <section className="stack--tight">
          <h2 className="card-group__title">What you can do next</h2>
          {whatNext}
        </section>
      ) : null}

      {whatPrototypeCannotDo ? (
        <section className="stack--tight">
          <h2 className="card-group__title">What this prototype cannot do</h2>
          {whatPrototypeCannotDo}
        </section>
      ) : null}

      {showRelevantLaw ? (
        <RelevantLawSources explanation={lawExplanation} sources={lawSources} />
      ) : null}
    </div>
  )
}
