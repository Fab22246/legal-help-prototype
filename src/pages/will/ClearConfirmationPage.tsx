import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWillState } from '../../state/will/WillState'
import { willPaths } from '../../state/will/willPaths'

export function ClearConfirmationPage() {
  const { clearAll } = useWillState()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  function clearAndReturn() {
    clearAll()
    navigate(willPaths.start, { replace: true })
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Clear all your answers?
        </h1>
      </div>
      <p className="page__text">You will return to the start page and will need to begin again.</p>
      <div className="govbb-btn-group">
        <button type="button" className="govbb-btn" onClick={clearAndReturn}>
          Clear answers and return to start
        </button>
      </div>
      <p className="page__text">
        <button type="button" className="govbb-btn--link" onClick={() => navigate(-1)}>
          Go back without clearing
        </button>
      </p>
    </div>
  )
}
