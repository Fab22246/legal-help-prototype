import type { ReactNode } from 'react'
import { BackLink } from '../navigation/BackLink'
import { PrototypeNotice } from '../PrototypeNotice'
import { Notice } from '../Notice'

interface CheckerPagePatternProps {
  title: string
  intro?: ReactNode
  /** Future questions slot. No checker logic is implemented in this phase. */
  children?: ReactNode
  /** Cautious signposting result (e.g. "You may need to ask about…"). */
  result?: ReactNode
  backTo?: string
  backLabel?: string
}

// Structural pattern for a checker route. Scaffold only — it must not implement
// a working questionnaire or make a legal decision. It supports asking simple
// questions and returning cautious signposting in a later phase.
export function CheckerPagePattern({
  title,
  intro,
  children,
  result,
  backTo = '/',
  backLabel = 'Back',
}: CheckerPagePatternProps) {
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

      {result ? (
        <section className="stack--tight">
          <h2 className="card-group__title">What you may need to do next</h2>
          {result}
        </section>
      ) : null}
    </div>
  )
}
