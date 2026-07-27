import type { ReactNode } from 'react'
import { BackLink } from '../../navigation/BackLink'
import { PrototypeNotice } from '../../PrototypeNotice'
import { Notice } from '../../Notice'

interface DraftOutputPagePatternProps {
  title?: string
  intro?: ReactNode
  /** The generated draft wording (added in a later phase). */
  children?: ReactNode
  /** Actions such as back-to-start links. */
  actions?: ReactNode
  backTo?: string
  backLabel?: string
}

// Builder-flow draft-output pattern. Always shows the "draft wording has not
// been legally reviewed" warning. Scaffold only — no document generation.
export function DraftOutputPagePattern({
  title = 'Draft output',
  intro,
  children,
  actions,
  backTo = '/',
  backLabel = 'Back',
}: DraftOutputPagePatternProps) {
  return (
    <div className="page">
      <BackLink to={backTo}>{backLabel}</BackLink>
      <div className="page__header">
        <h1 className="page__title">{title}</h1>
        {intro}
      </div>

      <PrototypeNotice />
      <Notice kind="draft-not-reviewed" />
      <Notice kind="legal-review-needed" />

      {children}

      {actions}
    </div>
  )
}
