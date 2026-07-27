import type { ReactNode } from 'react'

interface WarningNoticeProps {
  children: ReactNode
}

// A cautionary callout for later use (e.g. "get this checked before signing").
export function WarningNotice({ children }: WarningNoticeProps) {
  return (
    <div className="warning-notice" role="note">
      {children}
    </div>
  )
}
