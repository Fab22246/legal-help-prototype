import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { willPaths } from '../../state/will/willPaths'

// Secondary "Clear my answers" link shown on every will page after the start
// page except the terminal outcomes.
export function ClearMyAnswersLink() {
  return (
    <p className="page__text will-no-print">
      <Link className="govbb-link-default" to={willPaths.clearConfirm}>
        Clear my answers
      </Link>
    </p>
  )
}

interface WillPageProps {
  title: string
  children: ReactNode
  headingRef?: React.Ref<HTMLHeadingElement>
  showClear?: boolean
}

// Shared page shell for will-journey pages, reusing the existing page layout.
export function WillPage({ title, children, headingRef, showClear = true }: WillPageProps) {
  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          {title}
        </h1>
      </div>
      {children}
      {showClear ? <ClearMyAnswersLink /> : null}
    </div>
  )
}
