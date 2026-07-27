import type { ReactNode } from 'react'

interface DetailsAccordionProps {
  title: string
  children: ReactNode
}

// Progressive-disclosure block using the design system's show/hide component.
export function DetailsAccordion({ title, children }: DetailsAccordionProps) {
  return (
    <details className="govbb-show-hide">
      <summary className="govbb-show-hide__summary">{title}</summary>
      <div className="govbb-show-hide__content">{children}</div>
    </details>
  )
}
