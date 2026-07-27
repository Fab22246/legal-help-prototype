import { WarningNotice } from './WarningNotice'
import {
  PAGE_LEGAL_BOUNDARY,
  NOT_LIVE_SERVICE,
  DRAFT_NOT_REVIEWED,
  LEGAL_REVIEW_NEEDED,
} from '../data/content'

// Reusable page-level boundary notices. Prototype status itself is handled by
// PrototypeNotice / the layout StatusBanner; this covers the other standard
// boundary messages. Cautionary kinds reuse WarningNotice; informational kinds
// use the shared notice styling. Wording comes from the shared content strings.
export type NoticeKind =
  | 'legal-advice'
  | 'not-live-service'
  | 'draft-not-reviewed'
  | 'legal-review-needed'

const NOTICE_TEXT: Record<NoticeKind, string> = {
  'legal-advice': PAGE_LEGAL_BOUNDARY,
  'not-live-service': NOT_LIVE_SERVICE,
  'draft-not-reviewed': DRAFT_NOT_REVIEWED,
  'legal-review-needed': LEGAL_REVIEW_NEEDED,
}

const WARNING_KINDS: NoticeKind[] = ['draft-not-reviewed', 'legal-review-needed']

export function Notice({ kind }: { kind: NoticeKind }) {
  const text = NOTICE_TEXT[kind]

  if (WARNING_KINDS.includes(kind)) {
    return (
      <WarningNotice>
        <p>{text}</p>
      </WarningNotice>
    )
  }

  return (
    <div className="prototype-notice" role="note">
      <p>{text}</p>
    </div>
  )
}
