import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWillState } from '../../state/will/WillState'
import { willPaths } from '../../state/will/willPaths'
import type { RouteId } from '../../state/will/types'

// Guard for a result, signing or safekeeping page. The page may render only when
// state is active, an output has been confirmed (dateCreated captured) and the
// current route matches the page's route. Otherwise it replace-navigates to
// Check your answers, so a stale or wrong-route output is never rendered or
// printed, and browser Back cannot expose an out-of-date output.
export function useConfirmedOutput(expectedRoute: RouteId): boolean {
  const { active, answers, derived } = useWillState()
  const navigate = useNavigate()

  const ready = active && Boolean(answers.dateCreated) && derived.route === expectedRoute

  useEffect(() => {
    if (!active) {
      navigate(willPaths.start, { replace: true })
      return
    }
    if (!answers.dateCreated || derived.route !== expectedRoute) {
      navigate(willPaths.checkYourAnswers, { replace: true })
    }
  }, [active, answers.dateCreated, derived.route, expectedRoute, navigate])

  return ready
}
