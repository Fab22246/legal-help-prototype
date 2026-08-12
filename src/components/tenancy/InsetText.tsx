import type { ReactNode } from 'react'

// A bordered aside used to flag information that is not a question — e.g. a note
// that something will be shown as "to agree before the document is signed".
export function InsetText({ children }: { children: ReactNode }) {
  return <div className="inset-text">{children}</div>
}
