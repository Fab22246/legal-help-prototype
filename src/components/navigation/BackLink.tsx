import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface BackLinkProps {
  /** Destination path. Defaults to the home page. */
  to?: string
  children?: ReactNode
}

export function BackLink({ to = '/', children = 'Back' }: BackLinkProps) {
  return (
    <Link className="govbb-back-link" to={to}>
      <span className="govbb-back-link__icon" aria-hidden="true">
        ←
      </span>{' '}
      {children}
    </Link>
  )
}
