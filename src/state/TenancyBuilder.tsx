import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  TenancyBuilderContext,
  persist,
  readInitialState,
  type AgentDraft,
  type BillDraft,
  type BillRecord,
  type DatesStage,
  type DepositStage,
  type DepositTermsStage,
  type HomeStage,
  type ItemDraft,
  type ItemRecord,
  type LandlordDraft,
  type LandlordRecord,
  type AccessStage,
  type AdditionalTermDraft,
  type AdditionalTermRecord,
  type EndingStage,
  type OccupantDraft,
  type OccupantRecord,
  type PaymentStage,
  type PetsSmokingStage,
  type RentStage,
  type RepairsStage,
  type UsingHomeStage,
  type ScopeAnswers,
  type TenancyBuilderContextValue,
  type TenancyBuilderState,
  type TenantDraft,
  type TenantRecord,
  type WhatIsRented,
  type YesNo,
  type YesNotYet,
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

// Turn a completed bill draft into a finalised BillRecord, or undefined if the
// conditionally-required fields for the chosen arrangement are not all present.
function finaliseBillDraft(draft: BillDraft | undefined, fallbackId: string): BillRecord | undefined {
  if (!draft || !draft.service || !draft.arrangement) return undefined
  if (draft.service === 'other' && !draft.otherServiceName) return undefined
  const id = draft.editingId ?? fallbackId
  const rec: BillRecord = { id, service: draft.service, arrangement: draft.arrangement }
  if (draft.service === 'other') rec.otherServiceName = draft.otherServiceName
  if (draft.arrangement === 'tenant-pays-separately') {
    if (!draft.amountBasis) return undefined
    rec.amountBasis = draft.amountBasis
    if (draft.amountBasis === 'fixed') {
      if (!draft.fixedAmount || !draft.fixedFrequency) return undefined
      rec.fixedAmount = draft.fixedAmount
      rec.fixedFrequency = draft.fixedFrequency
      if (draft.fixedFrequency === 'other') {
        if (!draft.otherFrequency) return undefined
        rec.otherFrequency = draft.otherFrequency
      }
    } else if (draft.amountBasis === 'another-way') {
      if (!draft.amountAnotherWay) return undefined
      rec.amountAnotherWay = draft.amountAnotherWay
    }
    if (!draft.whenToPay) return undefined
    rec.whenToPay = draft.whenToPay
  }
  if (draft.arrangement === 'another-arrangement') {
    if (!draft.arrangementDescription) return undefined
    rec.arrangementDescription = draft.arrangementDescription
  }
  return rec
}

function finaliseOccupantDraft(
  draft: OccupantDraft | undefined,
  fallbackId: string,
): OccupantRecord | undefined {
  if (!draft || !draft.firstName || !draft.lastName) return undefined
  const id = draft.editingId ?? fallbackId
  const rec: OccupantRecord = { id, firstName: draft.firstName, lastName: draft.lastName }
  if (draft.middleNames) rec.middleNames = draft.middleNames
  return rec
}

function finaliseItemDraft(draft: ItemDraft | undefined, fallbackId: string): ItemRecord | undefined {
  if (!draft || !draft.item || !draft.quantity || !draft.conditionChecked) return undefined
  const id = draft.editingId ?? fallbackId
  const rec: ItemRecord = {
    id,
    item: draft.item,
    quantity: draft.quantity,
    conditionChecked: draft.conditionChecked,
  }
  if (draft.location) rec.location = draft.location
  if (draft.conditionChecked === 'yes') {
    if (!draft.conditionDescription) return undefined
    rec.conditionDescription = draft.conditionDescription
  }
  return rec
}

function finaliseAdditionalTermDraft(
  draft: AdditionalTermDraft | undefined,
  fallbackId: string,
): AdditionalTermRecord | undefined {
  if (!draft || !draft.text || !draft.text.trim()) return undefined
  const id = draft.editingId ?? fallbackId
  return { id, text: draft.text.trim() }
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
      const remaining = (prev.landlords ?? []).filter((l) => l.id !== id)
      const next: TenancyBuilderState = {
        ...prev,
        landlords: remaining.length > 0 ? remaining : undefined,
      }
      // The rent recipient is derived from the remaining landlords, so it is
      // not cleared here. Only clear a recipient/contact that specifically
      // points to the landlord being removed.
      if (next.deposit?.recipient?.kind === 'landlord' && next.deposit.recipient.landlordId === id) {
        const deposit = { ...next.deposit }
        delete deposit.recipient
        next.deposit = deposit
      }
      // The repair contact and its instructions are cleared only when the
      // contact is this specific landlord. Repair arrangements wording and the
      // agreed answer are preserved.
      if (next.repairs?.contact?.kind === 'landlord' && next.repairs.contact.landlordId === id) {
        const repairs = { ...next.repairs }
        delete repairs.contact
        delete repairs.contactInstructions
        next.repairs = repairs
      }
      return next
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
        const next: TenancyBuilderState = {
          ...prev,
          agent: { hasAgent: 'no' },
          editing: Object.keys(editing).length > 0 ? editing : undefined,
        }
        // A recipient of "the agent" is no longer valid once there is no agent.
        // Clear only the affected recipient answers; leave everything else.
        if (next.payment?.recipient === 'agent') {
          const payment = { ...next.payment }
          delete payment.recipient
          next.payment = payment
        }
        if (next.deposit?.recipient?.kind === 'agent') {
          const deposit = { ...next.deposit }
          delete deposit.recipient
          next.deposit = deposit
        }
        if (next.repairs?.contact?.kind === 'agent') {
          const repairs = { ...next.repairs }
          delete repairs.contact
          delete repairs.contactInstructions
          next.repairs = repairs
        }
        return next
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

  const saveRent = useCallback((rent: RentStage) => {
    setState((prev) => ({ ...prev, rent }))
  }, [])

  const savePayment = useCallback((payment: PaymentStage) => {
    setState((prev) => ({ ...prev, payment }))
  }, [])

  const saveDeposit = useCallback((deposit: DepositStage) => {
    setState((prev) => ({ ...prev, deposit }))
  }, [])

  // Confirmed change of "Will a deposit be paid?" from Yes to No: clears the
  // deposit amount, date, recipient and the whole deposit-terms answer/wording.
  const confirmNoDeposit = useCallback(() => {
    setState((prev) => {
      const next: TenancyBuilderState = { ...prev, deposit: { willBePaid: 'no' } }
      delete next.depositTerms
      return next
    })
  }, [])

  const saveDepositTerms = useCallback((depositTerms: DepositTermsStage) => {
    setState((prev) => ({ ...prev, depositTerms }))
  }, [])

  // Confirmed change of deposit-terms from Yes to Not yet: clears only the
  // user-entered deposit wording.
  const clearDepositTermsWording = useCallback(() => {
    setState((prev) => ({ ...prev, depositTerms: { agreed: 'not-yet' } }))
  }, [])

  const saveBillsAgreed = useCallback((agreed: YesNotYet) => {
    setState((prev) => ({
      ...prev,
      bills: { agreed, records: prev.bills?.records ?? [] },
    }))
  }, [])

  // Confirmed change of the bills decision from Yes to Not yet: clears records.
  const clearBillsRecords = useCallback(() => {
    setState((prev) => ({ ...prev, bills: { agreed: 'not-yet', records: [] } }))
  }, [])

  const setBillDraft = useCallback((patch: Partial<BillDraft>) => {
    setState((prev) => ({
      ...prev,
      editing: {
        ...(prev.editing ?? {}),
        billDraft: { ...(prev.editing?.billDraft ?? {}), ...patch },
      },
    }))
  }, [])

  const clearBillDraft = useCallback(() => {
    setState((prev) => {
      if (!prev.editing?.billDraft) return prev
      const editing = { ...prev.editing }
      delete editing.billDraft
      return { ...prev, editing: Object.keys(editing).length > 0 ? editing : undefined }
    })
  }, [])

  const saveBillDraft = useCallback(() => {
    setState((prev) => {
      const draft = prev.editing?.billDraft
      const finalised = finaliseBillDraft(draft, generateId())
      if (!finalised) return prev
      const existing = prev.bills?.records ?? []
      const nextRecords = draft?.editingId
        ? existing.map((b) => (b.id === draft.editingId ? finalised : b))
        : [...existing, finalised]
      const editing = { ...(prev.editing ?? {}) }
      delete editing.billDraft
      return {
        ...prev,
        bills: { agreed: 'yes', records: nextRecords },
        editing: Object.keys(editing).length > 0 ? editing : undefined,
      }
    })
  }, [])

  const removeBill = useCallback((id: string) => {
    setState((prev) => {
      if (!prev.bills) return prev
      const records = prev.bills.records.filter((b) => b.id !== id)
      return { ...prev, bills: { ...prev.bills, records } }
    })
  }, [])

  const startEditingBill = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.bills?.records.find((b) => b.id === id)
      if (!target) return prev
      const draft: BillDraft = { ...target, editingId: id }
      return { ...prev, editing: { ...(prev.editing ?? {}), billDraft: draft } }
    })
  }, [])

  const setOccupantsAnswer = useCallback((answer: YesNo) => {
    setState((prev) => ({
      ...prev,
      occupants: { willLive: answer, records: prev.occupants?.records ?? [] },
    }))
  }, [])

  const clearOccupantsRecords = useCallback(() => {
    setState((prev) => ({ ...prev, occupants: { willLive: 'no', records: [] } }))
  }, [])

  const setOccupantDraft = useCallback((patch: Partial<OccupantDraft>) => {
    setState((prev) => ({
      ...prev,
      editing: {
        ...(prev.editing ?? {}),
        occupantDraft: { ...(prev.editing?.occupantDraft ?? {}), ...patch },
      },
    }))
  }, [])

  const clearOccupantDraft = useCallback(() => {
    setState((prev) => {
      if (!prev.editing?.occupantDraft) return prev
      const editing = { ...prev.editing }
      delete editing.occupantDraft
      return { ...prev, editing: Object.keys(editing).length > 0 ? editing : undefined }
    })
  }, [])

  const saveOccupantDraft = useCallback(() => {
    setState((prev) => {
      const draft = prev.editing?.occupantDraft
      const finalised = finaliseOccupantDraft(draft, generateId())
      if (!finalised) return prev
      const existing = prev.occupants?.records ?? []
      const nextRecords = draft?.editingId
        ? existing.map((o) => (o.id === draft.editingId ? finalised : o))
        : [...existing, finalised]
      const editing = { ...(prev.editing ?? {}) }
      delete editing.occupantDraft
      return {
        ...prev,
        occupants: { willLive: 'yes', records: nextRecords },
        editing: Object.keys(editing).length > 0 ? editing : undefined,
      }
    })
  }, [])

  const removeOccupant = useCallback((id: string) => {
    setState((prev) => {
      if (!prev.occupants) return prev
      return {
        ...prev,
        occupants: { ...prev.occupants, records: prev.occupants.records.filter((o) => o.id !== id) },
      }
    })
  }, [])

  const startEditingOccupant = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.occupants?.records.find((o) => o.id === id)
      if (!target) return prev
      const draft: OccupantDraft = { ...target, editingId: id }
      return { ...prev, editing: { ...(prev.editing ?? {}), occupantDraft: draft } }
    })
  }, [])

  const setItemsAnswer = useCallback((answer: YesNo) => {
    setState((prev) => ({
      ...prev,
      items: { willProvide: answer, records: prev.items?.records ?? [] },
    }))
  }, [])

  const clearItemsRecords = useCallback(() => {
    setState((prev) => ({ ...prev, items: { willProvide: 'no', records: [] } }))
  }, [])

  const setItemDraft = useCallback((patch: Partial<ItemDraft>) => {
    setState((prev) => ({
      ...prev,
      editing: {
        ...(prev.editing ?? {}),
        itemDraft: { ...(prev.editing?.itemDraft ?? {}), ...patch },
      },
    }))
  }, [])

  const clearItemDraft = useCallback(() => {
    setState((prev) => {
      if (!prev.editing?.itemDraft) return prev
      const editing = { ...prev.editing }
      delete editing.itemDraft
      return { ...prev, editing: Object.keys(editing).length > 0 ? editing : undefined }
    })
  }, [])

  const saveItemDraft = useCallback(() => {
    setState((prev) => {
      const draft = prev.editing?.itemDraft
      const finalised = finaliseItemDraft(draft, generateId())
      if (!finalised) return prev
      const existing = prev.items?.records ?? []
      const nextRecords = draft?.editingId
        ? existing.map((it) => (it.id === draft.editingId ? finalised : it))
        : [...existing, finalised]
      const editing = { ...(prev.editing ?? {}) }
      delete editing.itemDraft
      return {
        ...prev,
        items: { willProvide: 'yes', records: nextRecords },
        editing: Object.keys(editing).length > 0 ? editing : undefined,
      }
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setState((prev) => {
      if (!prev.items) return prev
      return {
        ...prev,
        items: { ...prev.items, records: prev.items.records.filter((it) => it.id !== id) },
      }
    })
  }, [])

  const startEditingItem = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.items?.records.find((it) => it.id === id)
      if (!target) return prev
      const draft: ItemDraft = { ...target, editingId: id }
      return { ...prev, editing: { ...(prev.editing ?? {}), itemDraft: draft } }
    })
  }, [])

  const saveRepairs = useCallback((repairs: RepairsStage) => {
    setState((prev) => ({ ...prev, repairs }))
  }, [])

  const saveAccess = useCallback((access: AccessStage) => {
    setState((prev) => ({ ...prev, access }))
  }, [])

  const savePetsSmoking = useCallback((petsSmoking: PetsSmokingStage) => {
    setState((prev) => ({ ...prev, petsSmoking }))
  }, [])

  const saveUsingHome = useCallback((usingHome: UsingHomeStage) => {
    setState((prev) => ({ ...prev, usingHome }))
  }, [])

  const saveEnding = useCallback((ending: EndingStage) => {
    setState((prev) => ({ ...prev, ending }))
  }, [])

  // Saving new tenancy dates that change whether an end date exists invalidates
  // the earlier ending answer, so it is cleared as part of the same commit.
  const saveDatesClearEnding = useCallback((dates: DatesStage) => {
    setState((prev) => {
      const next: TenancyBuilderState = { ...prev, dates }
      delete next.ending
      return next
    })
  }, [])

  const setAdditionalTermsAnswer = useCallback((answer: YesNo) => {
    setState((prev) => ({
      ...prev,
      additionalTerms: { agreed: answer, records: prev.additionalTerms?.records ?? [] },
    }))
  }, [])

  const clearAdditionalTermsRecords = useCallback(() => {
    setState((prev) => ({ ...prev, additionalTerms: { agreed: 'no', records: [] } }))
  }, [])

  const setAdditionalTermDraft = useCallback((patch: Partial<AdditionalTermDraft>) => {
    setState((prev) => ({
      ...prev,
      editing: {
        ...(prev.editing ?? {}),
        additionalTermDraft: { ...(prev.editing?.additionalTermDraft ?? {}), ...patch },
      },
    }))
  }, [])

  const clearAdditionalTermDraft = useCallback(() => {
    setState((prev) => {
      if (!prev.editing?.additionalTermDraft) return prev
      const editing = { ...prev.editing }
      delete editing.additionalTermDraft
      return { ...prev, editing: Object.keys(editing).length > 0 ? editing : undefined }
    })
  }, [])

  const saveAdditionalTermDraft = useCallback(() => {
    setState((prev) => {
      const draft = prev.editing?.additionalTermDraft
      const finalised = finaliseAdditionalTermDraft(draft, generateId())
      if (!finalised) return prev
      const existing = prev.additionalTerms?.records ?? []
      const nextRecords = draft?.editingId
        ? existing.map((t) => (t.id === draft.editingId ? finalised : t))
        : [...existing, finalised]
      const editing = { ...(prev.editing ?? {}) }
      delete editing.additionalTermDraft
      return {
        ...prev,
        additionalTerms: { agreed: 'yes', records: nextRecords },
        editing: Object.keys(editing).length > 0 ? editing : undefined,
      }
    })
  }, [])

  const removeAdditionalTerm = useCallback((id: string) => {
    setState((prev) => {
      if (!prev.additionalTerms) return prev
      return {
        ...prev,
        additionalTerms: {
          ...prev.additionalTerms,
          records: prev.additionalTerms.records.filter((t) => t.id !== id),
        },
      }
    })
  }, [])

  const startEditingAdditionalTerm = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.additionalTerms?.records.find((t) => t.id === id)
      if (!target) return prev
      const draft: AdditionalTermDraft = { editingId: id, text: target.text }
      return { ...prev, editing: { ...(prev.editing ?? {}), additionalTermDraft: draft } }
    })
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
      delete next.rent
      delete next.payment
      delete next.deposit
      delete next.depositTerms
      delete next.bills
      delete next.occupants
      delete next.items
      delete next.repairs
      delete next.access
      delete next.petsSmoking
      delete next.usingHome
      delete next.ending
      delete next.additionalTerms
      if (next.editing) {
        const editing = { ...next.editing }
        delete editing.landlordDraft
        delete editing.tenantDraft
        delete editing.agentDraft
        delete editing.billDraft
        delete editing.occupantDraft
        delete editing.itemDraft
        delete editing.additionalTermDraft
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
      // A recipient of "the agent" is no longer valid once there is no agent.
      // Clear only the affected recipient answers; leave everything else.
      if (next.payment?.recipient === 'agent') {
        const payment = { ...next.payment }
        delete payment.recipient
        next.payment = payment
      }
      if (next.deposit?.recipient?.kind === 'agent') {
        const deposit = { ...next.deposit }
        delete deposit.recipient
        next.deposit = deposit
      }
      if (next.repairs?.contact?.kind === 'agent') {
        const repairs = { ...next.repairs }
        delete repairs.contact
        delete repairs.contactInstructions
        next.repairs = repairs
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
      saveRent,
      savePayment,
      saveDeposit,
      confirmNoDeposit,
      saveDepositTerms,
      clearDepositTermsWording,
      saveBillsAgreed,
      clearBillsRecords,
      setBillDraft,
      clearBillDraft,
      saveBillDraft,
      removeBill,
      startEditingBill,
      setOccupantsAnswer,
      clearOccupantsRecords,
      setOccupantDraft,
      clearOccupantDraft,
      saveOccupantDraft,
      removeOccupant,
      startEditingOccupant,
      setItemsAnswer,
      clearItemsRecords,
      setItemDraft,
      clearItemDraft,
      saveItemDraft,
      removeItem,
      startEditingItem,
      saveRepairs,
      saveAccess,
      savePetsSmoking,
      saveUsingHome,
      saveEnding,
      saveDatesClearEnding,
      setAdditionalTermsAnswer,
      clearAdditionalTermsRecords,
      setAdditionalTermDraft,
      clearAdditionalTermDraft,
      saveAdditionalTermDraft,
      removeAdditionalTerm,
      startEditingAdditionalTerm,
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
      saveRent,
      savePayment,
      saveDeposit,
      confirmNoDeposit,
      saveDepositTerms,
      clearDepositTermsWording,
      saveBillsAgreed,
      clearBillsRecords,
      setBillDraft,
      clearBillDraft,
      saveBillDraft,
      removeBill,
      startEditingBill,
      setOccupantsAnswer,
      clearOccupantsRecords,
      setOccupantDraft,
      clearOccupantDraft,
      saveOccupantDraft,
      removeOccupant,
      startEditingOccupant,
      setItemsAnswer,
      clearItemsRecords,
      setItemDraft,
      clearItemDraft,
      saveItemDraft,
      removeItem,
      startEditingItem,
      saveRepairs,
      saveAccess,
      savePetsSmoking,
      saveUsingHome,
      saveEnding,
      saveDatesClearEnding,
      setAdditionalTermsAnswer,
      clearAdditionalTermsRecords,
      setAdditionalTermDraft,
      clearAdditionalTermDraft,
      saveAdditionalTermDraft,
      removeAdditionalTerm,
      startEditingAdditionalTerm,
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
