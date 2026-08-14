import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWillState } from '../../state/will/WillState'
import { willPaths } from '../../state/will/willPaths'

// Replace any will-journey page with the start page when there is no active
// in-memory state, so refresh, direct entry or browser Back cannot render a
// page from missing or cleared answers. Returns whether state is active.
export function useWillGuard(): boolean {
  const { active } = useWillState()
  const navigate = useNavigate()

  useEffect(() => {
    if (!active) navigate(willPaths.start, { replace: true })
  }, [active, navigate])

  return active
}
