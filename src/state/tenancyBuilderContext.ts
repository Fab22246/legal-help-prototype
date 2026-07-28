import { createContext, useContext } from 'react'

// Non-component exports for the tenancy-builder state: types, storage helpers
// and the context/hook. The Provider component lives alongside in
// TenancyBuilder.tsx. Split to keep react-refresh happy (a .tsx file that
// exports both a component and hooks/constants disables fast refresh for it).
//
// State shape is intentionally minimal: this slice retains only the scope
// answers. Later slices (landlord, tenant, property, rent, deposit, agreement
// terms, check-answers, draft) will extend TenancyBuilderState here — do not
// invent them now.

export const STORAGE_KEY = 'gov-bb.tenancy-builder.v1'

export type YesNo = 'yes' | 'no'

export type WhatIsRented =
  | 'house-apartment'
  | 'self-contained-part'
  | 'room-shared'
  | 'business'
  | 'land'
  | 'other'

export type AgreementSituation =
  | 'preparing-new'
  | 'change-existing'
  | 'disagree'
  | 'asked-to-leave'

export interface ScopeAnswers {
  forRentingHomeBarbados?: YesNo
  whatIsRented?: WhatIsRented
  privateHomeOnly?: YesNo
  agreementSituation?: AgreementSituation
}

export interface TenancyBuilderState {
  scope?: ScopeAnswers
}

export interface TenancyBuilderContextValue {
  state: TenancyBuilderState
  setScope: (patch: Partial<ScopeAnswers>) => void
}

export const TenancyBuilderContext = createContext<TenancyBuilderContextValue | null>(null)

const YES_NO_VALUES: YesNo[] = ['yes', 'no']
const WHAT_IS_RENTED_VALUES: WhatIsRented[] = [
  'house-apartment',
  'self-contained-part',
  'room-shared',
  'business',
  'land',
  'other',
]
const AGREEMENT_SITUATION_VALUES: AgreementSituation[] = [
  'preparing-new',
  'change-existing',
  'disagree',
  'asked-to-leave',
]

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sanitiseEnum<T extends string>(value: unknown, allowed: T[]): T | undefined {
  return typeof value === 'string' && (allowed as string[]).includes(value) ? (value as T) : undefined
}

function sanitiseScope(raw: unknown): ScopeAnswers | undefined {
  if (!isPlainObject(raw)) return undefined
  const cleaned: ScopeAnswers = {
    forRentingHomeBarbados: sanitiseEnum(raw.forRentingHomeBarbados, YES_NO_VALUES),
    whatIsRented: sanitiseEnum(raw.whatIsRented, WHAT_IS_RENTED_VALUES),
    privateHomeOnly: sanitiseEnum(raw.privateHomeOnly, YES_NO_VALUES),
    agreementSituation: sanitiseEnum(raw.agreementSituation, AGREEMENT_SITUATION_VALUES),
  }
  const hasAny = Object.values(cleaned).some((v) => v !== undefined)
  return hasAny ? cleaned : undefined
}

export function readInitialState(): TenancyBuilderState {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!isPlainObject(parsed)) return {}
    const scope = sanitiseScope(parsed.scope)
    return scope ? { scope } : {}
  } catch {
    return {}
  }
}

export function persist(state: TenancyBuilderState): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage may be unavailable (private mode, quota, disabled). The user's
    // journey still works within a single page load.
  }
}

export function useTenancyBuilder(): TenancyBuilderContextValue {
  const ctx = useContext(TenancyBuilderContext)
  if (!ctx) {
    throw new Error('useTenancyBuilder must be used inside <TenancyBuilderProvider>')
  }
  return ctx
}
