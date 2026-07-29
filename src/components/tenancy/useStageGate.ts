import { useTenancyBuilder } from '../../state/tenancyBuilderContext'
import {
  findEarliestMissing,
  isUnsuitableScope,
  type StageKey,
} from '../../state/tenancyBuilderStageStatus'

export type StageGate =
  | { kind: 'ok' }
  | { kind: 'unsuitable' }
  | { kind: 'missing'; key: StageKey }

// Shared prerequisite check for every builder route beyond the scope page.
//
// If the user has completed the suitability questions but landed on an
// unsuitable outcome, they should not be asked to re-answer them — they
// should be sent straight to the safe exit. Otherwise, the earliest missing
// prerequisite (if any) is returned so the caller can render the recovery
// view.
export function useStageGate(stage: StageKey): StageGate {
  const { state } = useTenancyBuilder()
  if (isUnsuitableScope(state)) return { kind: 'unsuitable' }
  const missing = findEarliestMissing(state, stage)
  if (missing) return { kind: 'missing', key: missing }
  return { kind: 'ok' }
}
