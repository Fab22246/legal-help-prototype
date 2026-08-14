import { Navigate, useSearchParams } from 'react-router-dom'
import { useWillState } from '../../state/will/WillState'
import { stepPath, willPaths } from '../../state/will/willPaths'
import type { WillAnswers } from '../../state/will/types'

const ROLE_PREFIX_TO_STEP: Record<string, string> = {
  executor: 'e2',
  'replacement executor': 'e4',
  guardian: 'g2',
  'replacement guardian': 'g4',
  gift: 'sg2',
  remainder: 'r2',
  p2: 'p2',
  c3: 'c3',
  c4: 'c4',
}

// The person-owning family section for a shared person record.
function personSection(answers: WillAnswers, id: string): string | undefined {
  if (answers.minorChildIds.includes(id)) return 'f2'
  if (answers.dependantAdultChildIds.includes(id)) return 'f4'
  if (answers.otherDependantIds.includes(id)) return 'f6'
  return undefined
}

function changeTarget(answers: WillAnswers, target: string): string | undefined {
  if (!target.includes(':')) {
    // A scalar step id (suitability, about, radio, or c5).
    return `${stepPath(target)}?mode=change`
  }
  const separator = target.indexOf(':')
  const prefix = target.slice(0, separator)
  const recordId = target.slice(separator + 1)
  if (prefix === 'person') {
    const section = personSection(answers, recordId)
    return section ? `${stepPath(section)}?mode=change&record=${encodeURIComponent(recordId)}` : undefined
  }
  if (prefix === 'c2') {
    return `${stepPath('c2')}?mode=change`
  }
  const step = ROLE_PREFIX_TO_STEP[prefix]
  if (!step) return undefined
  return `${stepPath(step)}?mode=change&record=${encodeURIComponent(recordId)}`
}

// Translates a Check your answers Change target into the owning editor in change
// mode.
export function WillChangePage() {
  const { active, answers } = useWillState()
  const [params] = useSearchParams()
  const target = params.get('target') ?? ''

  if (!active) return <Navigate to={willPaths.start} replace />
  const destination = changeTarget(answers, target)
  return <Navigate to={destination ?? willPaths.checkYourAnswers} replace />
}
