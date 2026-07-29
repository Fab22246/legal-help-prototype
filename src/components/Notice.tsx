import { WarningNotice } from './WarningNotice'
import { DRAFT_NOT_REVIEWED, LEGAL_REVIEW_NEEDED } from '../data/content'

// Reusable page-level cautionary notices. The global StatusBanner in the app
// shell carries the prototype / not-live / general legal-advice boundary;
// this covers the remaining specific warnings (draft and legal-review) and
// any future page-specific boundary that a future kind can be added for.
export type NoticeKind = 'draft-not-reviewed' | 'legal-review-needed'

const NOTICE_TEXT: Record<NoticeKind, string> = {
  'draft-not-reviewed': DRAFT_NOT_REVIEWED,
  'legal-review-needed': LEGAL_REVIEW_NEEDED,
}

export function Notice({ kind }: { kind: NoticeKind }) {
  return (
    <WarningNotice>
      <p>{NOTICE_TEXT[kind]}</p>
    </WarningNotice>
  )
}
