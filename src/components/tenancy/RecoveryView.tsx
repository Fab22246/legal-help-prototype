import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BackLink } from '../navigation/BackLink'
import type { StageInfo } from '../../state/tenancyBuilderStageStatus'

interface RecoveryViewProps {
  /** The stage the user needs to complete before continuing. */
  missing: StageInfo
}

// One consistent accessible recovery view for direct entry to a stage that
// has an unmet prerequisite. H1 receives focus on mount; no answers are
// exposed here.
export function RecoveryView({ missing }: RecoveryViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [missing.key])

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Complete an earlier step
        </h1>
        <p className="page__text">
          Before you can continue, you need to complete {missing.label}.
        </p>
      </div>
      <p className="page__text">
        <Link className="govbb-link-default" to={missing.path}>
          Go to {missing.actionLabel}
        </Link>
      </p>
    </div>
  )
}
