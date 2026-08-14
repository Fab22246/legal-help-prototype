import type { NavigateFunction } from 'react-router-dom'
import { stepPath, willPaths } from '../../state/will/willPaths'

// Navigate to a journey destination. 'cya' goes to Check your answers; any other
// value is a step id.
export function goTo(navigate: NavigateFunction, destination: string): void {
  navigate(destination === 'cya' ? willPaths.checkYourAnswers : stepPath(destination))
}

// Navigate after saving a page, keeping change mode so newly required questions
// return to Check your answers rather than continuing the forward journey.
export function proceed(navigate: NavigateFunction, mode: 'forward' | 'change', destination: string): void {
  if (destination === 'cya') {
    navigate(willPaths.checkYourAnswers)
    return
  }
  navigate(stepPath(destination) + (mode === 'change' ? '?mode=change' : ''))
}
