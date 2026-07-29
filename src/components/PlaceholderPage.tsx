import { useEffect, useRef } from 'react'
import { BackLink } from './navigation/BackLink'
import { PLACEHOLDER_SENTENCE } from '../data/content'
import type { RouteMeta } from '../data/routes'

interface PlaceholderPageProps {
  meta?: RouteMeta
  notFound?: boolean
}

// Placeholder rendered for every planned route (and unknown paths). Title +
// one planned-status sentence + back link. The global StatusBanner in the app
// shell carries the prototype / not-live / legal-advice boundary.
export function PlaceholderPage({ meta, notFound = false }: PlaceholderPageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Move focus to the page heading on navigation for screen-reader users.
  useEffect(() => {
    headingRef.current?.focus()
  }, [meta?.path, notFound])

  const title = notFound ? 'Page not found' : (meta?.title ?? 'Page')
  const sentence = notFound
    ? 'This page does not exist.'
    : PLACEHOLDER_SENTENCE

  return (
    <div className="page">
      <BackLink to="/">Back to home</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          {title}
        </h1>
        <p className="page__text">{sentence}</p>
      </div>
    </div>
  )
}
