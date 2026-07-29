import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  TenancyBuilderContext,
  persist,
  readInitialState,
  type AgentDraft,
  type DatesStage,
  type HomeStage,
  type LandlordDraft,
  type LandlordRecord,
  type ScopeAnswers,
  type TenancyBuilderContextValue,
  type TenancyBuilderState,
  type TenantDraft,
  type TenantRecord,
  type WhatIsRented,
  type YesNo,
} from './tenancyBuilderContext'
import { generateId } from './generateId'
import { isSessionStorageAvailable } from './tenancyStorage'

interface TenancyBuilderProviderProps {
  children: ReactNode
}

// Turn a completed draft into a finalised LandlordRecord. Returns undefined if
// the draft is not complete enough to save.
function finaliseLandlordDraft(draft: LandlordDraft | undefined, fallbackId: string): LandlordRecord | undefined {
  if (!draft || !draft.partyType || !draft.address) return undefined
  const id = draft.editingId ?? fallbackId
  if (draft.partyType === 'person') {
    if (!draft.personName?.firstName || !draft.personName.lastName) return undefined
    return { id, partyType: 'person', personName: draft.personName, address: draft.address }
  }
  if (!draft.organisationName) return undefined
  return { id, partyType: 'organisation', organisationName: draft.organisationName, address: draft.address }
}

function finaliseTenantDraft(draft: TenantDraft | undefined, fallbackId: string): TenantRecord | undefined {
  if (!draft || !draft.partyType) return undefined
  const id = draft.editingId ?? fallbackId
  if (draft.partyType === 'person') {
    if (!draft.personName?.firstName || !draft.personName.lastName) return undefined
    return { id, partyType: 'person', personName: draft.personName }
  }
  if (!draft.organisationName) return undefined
  return { id, partyType: 'organisation', organisationName: draft.organisationName }
}

export function TenancyBuilderProvider({ children }: TenancyBuilderProviderProps) {
  const [state, setState] = useState<TenancyBuilderState>(() => readInitialState())
  const [storageAvailable] = useState(() => isSessionStorageAvailable())

  useEffect(() => {
    if (storageAvailable) persist(state)
  }, [state, storageAvailable])

  const setScope = useCallback((patch: Partial<ScopeAnswers>) => {
    setState((prev) => ({ ...prev, scope: { ...(prev.scope ?? {}), ...patch } }))
  }, [])

  const setLandlordDraft = useCallback((patch: Partial<LandlordDraft>) => {
    setState((prev) => ({
      ...prev,
      editing: {
        ...(prev.editing ?? {}),
        landlordDraft: { ...(prev.editing?.landlordDraft ?? {}), ...patch },
      },
    }))
  }, [])

  const clearLandlordDraft = useCallback(() => {
    setState((prev) => {
      if (!prev.editing?.landlordDraft) return prev
      const editing = { ...prev.editing }
      delete editing.landlordDraft
      return {
        ...prev,
        editing: Object.keys(editing).length > 0 ? editing : undefined,
      }
    })
  }, [])

  const saveLandlordDraft = useCallback(() => {
    setState((prev) => {
      const draft = prev.editing?.landlordDraft
      const finalised = finaliseLandlordDraft(draft, generateId())
      if (!finalised) return prev
      const existing = prev.landlords ?? []
      const nextLandlords = draft?.editingId
        ? existing.map((l) => (l.id === draft.editingId ? finalised : l))
        : [...existing, finalised]
      const editing = { ...(prev.editing ?? {}) }
      delete editing.landlordDraft
      return {
        ...prev,
        landlords: nextLandlords,
        editing: Object.keys(editing).length > 0 ? editing : undefined,
      }
    })
  }, [])

  const removeLandlord = useCallback((id: string) => {
    setState((prev) => {
      const next = (prev.landlords ?? []).filter((l) => l.id !== id)
      return { ...prev, landlords: next.length > 0 ? next : undefined }
    })
  }, [])

  const startEditingLandlord = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.landlords?.find((l) => l.id === id)
      if (!target) return prev
      const draft: LandlordDraft = {
        editingId: id,
        partyType: target.partyType,
        personName: target.personName,
        organisationName: target.organisationName,
        address: target.address,
      }
      return {
        ...prev,
        editing: { ...(prev.editing ?? {}), landlordDraft: draft },
      }
    })
  }, [])

  const setTenantDraft = useCallback((patch: Partial<TenantDraft>) => {
    setState((prev) => ({
      ...prev,
      editing: {
        ...(prev.editing ?? {}),
        tenantDraft: { ...(prev.editing?.tenantDraft ?? {}), ...patch },
      },
    }))
  }, [])

  const clearTenantDraft = useCallback(() => {
    setState((prev) => {
      if (!prev.editing?.tenantDraft) return prev
      const editing = { ...prev.editing }
      delete editing.tenantDraft
      return { ...prev, editing: Object.keys(editing).length > 0 ? editing : undefined }
    })
  }, [])

  const saveTenantDraft = useCallback(() => {
    setState((prev) => {
      const draft = prev.editing?.tenantDraft
      const finalised = finaliseTenantDraft(draft, generateId())
      if (!finalised) return prev
      const existing = prev.tenants ?? []
      const nextTenants = draft?.editingId
        ? existing.map((t) => (t.id === draft.editingId ? finalised : t))
        : [...existing, finalised]
      const editing = { ...(prev.editing ?? {}) }
      delete editing.tenantDraft
      return {
        ...prev,
        tenants: nextTenants,
        editing: Object.keys(editing).length > 0 ? editing : undefined,
      }
    })
  }, [])

  const removeTenant = useCallback((id: string) => {
    setState((prev) => {
      const next = (prev.tenants ?? []).filter((t) => t.id !== id)
      return { ...prev, tenants: next.length > 0 ? next : undefined }
    })
  }, [])

  const startEditingTenant = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.tenants?.find((t) => t.id === id)
      if (!target) return prev
      const draft: TenantDraft = {
        editingId: id,
        partyType: target.partyType,
        personName: target.personName,
        organisationName: target.organisationName,
      }
      return { ...prev, editing: { ...(prev.editing ?? {}), tenantDraft: draft } }
    })
  }, [])

  const setAgentAnswer = useCallback((answer: YesNo) => {
    setState((prev) => {
      const prevAgent = prev.agent
      if (answer === 'no') {
        // Clear any saved agent details and any in-progress edit.
        const editing = { ...(prev.editing ?? {}) }
        delete editing.agentDraft
        return {
          ...prev,
          agent: { hasAgent: 'no' },
          editing: Object.keys(editing).length > 0 ? editing : undefined,
        }
      }
      // 'yes' — preserve any existing saved details until the user edits/saves.
      return { ...prev, agent: { hasAgent: 'yes', details: prevAgent?.details } }
    })
  }, [])

  const setAgentDraft = useCallback((patch: Partial<AgentDraft>) => {
    setState((prev) => ({
      ...prev,
      editing: {
        ...(prev.editing ?? {}),
        agentDraft: { ...(prev.editing?.agentDraft ?? {}), ...patch },
      },
    }))
  }, [])

  const clearAgentDraft = useCallback(() => {
    setState((prev) => {
      if (!prev.editing?.agentDraft) return prev
      const editing = { ...prev.editing }
      delete editing.agentDraft
      return { ...prev, editing: Object.keys(editing).length > 0 ? editing : undefined }
    })
  }, [])

  const saveAgentDraft = useCallback(() => {
    setState((prev) => {
      const draft = prev.editing?.agentDraft
      if (!draft || !draft.partyType || !draft.address) return prev
      if (draft.partyType === 'person') {
        if (!draft.personName?.firstName || !draft.personName.lastName) return prev
      } else if (!draft.organisationName) {
        return prev
      }
      const details =
        draft.partyType === 'person'
          ? { partyType: 'person' as const, personName: draft.personName!, address: draft.address }
          : {
              partyType: 'organisation' as const,
              organisationName: draft.organisationName!,
              address: draft.address,
            }
      const editing = { ...(prev.editing ?? {}) }
      delete editing.agentDraft
      return {
        ...prev,
        agent: { hasAgent: 'yes', details },
        editing: Object.keys(editing).length > 0 ? editing : undefined,
      }
    })
  }, [])

  const saveHome = useCallback((home: HomeStage) => {
    setState((prev) => ({ ...prev, home }))
  }, [])

  const saveDates = useCallback((dates: DatesStage) => {
    setState((prev) => ({ ...prev, dates }))
  }, [])

  const setHasAgreedEndDate = useCallback((answer: YesNo) => {
    setState((prev) => {
      if (!prev.dates) return prev
      if (answer === 'no') {
        const next = { ...prev.dates, hasAgreedEndDate: 'no' as YesNo }
        delete next.endDate
        return { ...prev, dates: next }
      }
      return { ...prev, dates: { ...prev.dates, hasAgreedEndDate: 'yes' } }
    })
  }, [])

  const clearFromLandlordsOnwards = useCallback(() => {
    setState((prev) => {
      const next: TenancyBuilderState = { ...prev }
      delete next.landlords
      delete next.agent
      delete next.tenants
      delete next.home
      delete next.dates
      if (next.editing) {
        const editing = { ...next.editing }
        delete editing.landlordDraft
        delete editing.tenantDraft
        delete editing.agentDraft
        next.editing = Object.keys(editing).length > 0 ? editing : undefined
      }
      return next
    })
  }, [])

  const clearAgent = useCallback(() => {
    setState((prev) => {
      const next: TenancyBuilderState = { ...prev }
      delete next.agent
      if (next.editing) {
        const editing = { ...next.editing }
        delete editing.agentDraft
        next.editing = Object.keys(editing).length > 0 ? editing : undefined
      }
      return next
    })
  }, [])

  const clearHomeIdentifiers = useCallback((whatIsRented: WhatIsRented) => {
    setState((prev) => {
      if (!prev.home) return prev
      const next = { ...prev.home }
      if (whatIsRented === 'house-apartment') {
        // Coming from self-contained to house/apartment — drop the required identifier.
        delete next.selfContainedIdentifier
      } else if (whatIsRented === 'self-contained-part') {
        // Coming from house/apartment to self-contained — drop the optional identifier.
        delete next.optionalIdentifier
      }
      return { ...prev, home: next }
    })
  }, [])

  const resetAll = useCallback(() => {
    setState({})
    if (typeof window !== 'undefined' && storageAvailable) {
      try {
        window.sessionStorage.removeItem('gov-bb.tenancy-builder.v1')
      } catch {
        // ignore
      }
    }
  }, [storageAvailable])

  const value = useMemo<TenancyBuilderContextValue>(
    () => ({
      state,
      storageAvailable,
      setScope,
      setLandlordDraft,
      clearLandlordDraft,
      saveLandlordDraft,
      removeLandlord,
      startEditingLandlord,
      setTenantDraft,
      clearTenantDraft,
      saveTenantDraft,
      removeTenant,
      startEditingTenant,
      setAgentAnswer,
      setAgentDraft,
      clearAgentDraft,
      saveAgentDraft,
      saveHome,
      saveDates,
      setHasAgreedEndDate,
      clearFromLandlordsOnwards,
      clearAgent,
      clearHomeIdentifiers,
      resetAll,
    }),
    [
      state,
      storageAvailable,
      setScope,
      setLandlordDraft,
      clearLandlordDraft,
      saveLandlordDraft,
      removeLandlord,
      startEditingLandlord,
      setTenantDraft,
      clearTenantDraft,
      saveTenantDraft,
      removeTenant,
      startEditingTenant,
      setAgentAnswer,
      setAgentDraft,
      clearAgentDraft,
      saveAgentDraft,
      saveHome,
      saveDates,
      setHasAgreedEndDate,
      clearFromLandlordsOnwards,
      clearAgent,
      clearHomeIdentifiers,
      resetAll,
    ],
  )

  return (
    <TenancyBuilderContext.Provider value={value}>{children}</TenancyBuilderContext.Provider>
  )
}
