import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { generateId } from '../generateId'
import { computeDerived } from './routeEngine'
import { normalizeAnswers } from './clearing'
import { formatCreatedDate } from './format'
import { createEmptyAnswers } from './types'
import type { WillAnswers, WillDerived } from './types'

export interface WillStateContextValue {
  answers: WillAnswers
  derived: WillDerived
  // True once the person has started the journey and state is live in memory.
  active: boolean
  // Mark the journey started (Start now).
  start: () => void
  // Apply a change to the answers, then normalise dependent fields.
  update: (mutator: (draft: WillAnswers) => void) => void
  // Apply a change and return the normalised answers, so the caller can compute
  // the next step from the updated state without waiting for a re-render.
  applyAndGet: (mutator: (draft: WillAnswers) => void) => WillAnswers
  // Clear every answer and end the active session.
  clearAll: () => void
  // S2 safeguarding: clear substantive answers, keep only the screen marker.
  safeguardingClear: () => void
  // Capture the created date for the confirmed output.
  captureDateCreated: () => void
  // New stable id for a person, organisation or repeatable record.
  newId: () => string
}

const WillStateContext = createContext<WillStateContextValue | null>(null)

export function WillStateProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<WillAnswers>(() => createEmptyAnswers())
  const [active, setActive] = useState(false)

  const answersRef = useRef(answers)
  answersRef.current = answers

  const derived = useMemo(() => computeDerived(answers), [answers])

  const update = useCallback((mutator: (draft: WillAnswers) => void) => {
    setAnswers((prev) => {
      const draft: WillAnswers = { ...prev }
      mutator(draft)
      // Any substantive change invalidates a previously created output.
      draft.dateCreated = undefined
      return normalizeAnswers(draft)
    })
  }, [])

  const applyAndGet = useCallback((mutator: (draft: WillAnswers) => void) => {
    const draft: WillAnswers = { ...answersRef.current }
    mutator(draft)
    draft.dateCreated = undefined
    const next = normalizeAnswers(draft)
    setAnswers(next)
    return next
  }, [])

  const start = useCallback(() => setActive(true), [])

  const clearAll = useCallback(() => {
    setAnswers(createEmptyAnswers())
    setActive(false)
  }, [])

  const safeguardingClear = useCallback(() => {
    const cleared = createEmptyAnswers()
    cleared.safeguardingScreen = true
    setAnswers(cleared)
    setActive(true)
  }, [])

  const captureDateCreated = useCallback(() => {
    setAnswers((prev) => ({ ...prev, dateCreated: formatCreatedDate(new Date()) }))
  }, [])

  const newId = useCallback(() => generateId(), [])

  const value = useMemo<WillStateContextValue>(
    () => ({
      answers,
      derived,
      active,
      start,
      update,
      applyAndGet,
      clearAll,
      safeguardingClear,
      captureDateCreated,
      newId,
    }),
    [answers, derived, active, start, update, applyAndGet, clearAll, safeguardingClear, captureDateCreated, newId],
  )

  return <WillStateContext.Provider value={value}>{children}</WillStateContext.Provider>
}

export function useWillState(): WillStateContextValue {
  const ctx = useContext(WillStateContext)
  if (!ctx) throw new Error('useWillState must be used within a WillStateProvider')
  return ctx
}
