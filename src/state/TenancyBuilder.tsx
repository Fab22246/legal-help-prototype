import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  TenancyBuilderContext,
  persist,
  readInitialState,
  type ScopeAnswers,
  type TenancyBuilderContextValue,
  type TenancyBuilderState,
} from './tenancyBuilderContext'

interface TenancyBuilderProviderProps {
  children: ReactNode
}

// Provider for the tenancy-builder state. Reads sessionStorage once on mount
// and persists on every change. Types, context and the hook live in
// ./tenancyBuilderContext so this file only exports a component.
export function TenancyBuilderProvider({ children }: TenancyBuilderProviderProps) {
  const [state, setState] = useState<TenancyBuilderState>(() => readInitialState())

  useEffect(() => {
    persist(state)
  }, [state])

  const setScope = useCallback((patch: Partial<ScopeAnswers>) => {
    setState((prev) => ({
      ...prev,
      scope: { ...(prev.scope ?? {}), ...patch },
    }))
  }, [])

  const value = useMemo<TenancyBuilderContextValue>(
    () => ({ state, setScope }),
    [state, setScope],
  )

  return (
    <TenancyBuilderContext.Provider value={value}>{children}</TenancyBuilderContext.Provider>
  )
}
