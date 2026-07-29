import type { TenancyBuilderState } from './tenancyBuilderContext'

// Stage identifiers used by the recovery view. Names must be stable — page
// components reference them by string.
export type StageKey = 'scope' | 'landlords' | 'agent' | 'tenants' | 'home' | 'dates'

export interface StageInfo {
  key: StageKey
  /** Route path the user should be directed to for this stage. */
  path: string
  /** Public-facing name used in recovery copy: "…complete [stage]". */
  label: string
  /** Public-facing action label: "Go to [stage]". */
  actionLabel: string
}

export const STAGES: Record<StageKey, StageInfo> = {
  scope: {
    key: 'scope',
    path: '/renting-home/agreement/scope',
    label: 'the suitability questions',
    actionLabel: 'the suitability questions',
  },
  landlords: {
    key: 'landlords',
    path: '/renting-home/agreement/landlords',
    label: 'landlord details',
    actionLabel: 'landlord details',
  },
  agent: {
    key: 'agent',
    path: '/renting-home/agreement/agent',
    label: 'the agent or manager question',
    actionLabel: 'the agent or manager question',
  },
  tenants: {
    key: 'tenants',
    path: '/renting-home/agreement/tenants',
    label: 'tenant details',
    actionLabel: 'tenant details',
  },
  home: {
    key: 'home',
    path: '/renting-home/agreement/home',
    label: 'details about the home',
    actionLabel: 'details about the home',
  },
  dates: {
    key: 'dates',
    path: '/renting-home/agreement/dates',
    label: 'tenancy dates',
    actionLabel: 'tenancy dates',
  },
}

export function isSuitableScope(state: TenancyBuilderState): boolean {
  const s = state.scope
  if (!s) return false
  return (
    s.forRentingHomeBarbados === 'yes' &&
    (s.whatIsRented === 'house-apartment' || s.whatIsRented === 'self-contained-part') &&
    s.privateHomeOnly === 'yes' &&
    s.agreementSituation === 'preparing-new'
  )
}

export function isUnsuitableScope(state: TenancyBuilderState): boolean {
  const s = state.scope
  if (!s) return false
  const allAnswered =
    s.forRentingHomeBarbados !== undefined &&
    s.whatIsRented !== undefined &&
    s.privateHomeOnly !== undefined &&
    s.agreementSituation !== undefined
  return allAnswered && !isSuitableScope(state)
}

export function hasCompletedLandlords(state: TenancyBuilderState): boolean {
  return (state.landlords?.length ?? 0) >= 1
}

export function hasCompletedAgent(state: TenancyBuilderState): boolean {
  const a = state.agent
  if (!a) return false
  if (a.hasAgent === 'no') return true
  if (a.hasAgent === 'yes' && a.details) return true
  return false
}

export function hasCompletedTenants(state: TenancyBuilderState): boolean {
  return (state.tenants?.length ?? 0) >= 1
}

export function hasCompletedHome(state: TenancyBuilderState): boolean {
  const h = state.home
  if (!h?.address) return false
  const rented = state.scope?.whatIsRented
  if (rented === 'self-contained-part') {
    return !!h.selfContainedIdentifier && h.selfContainedIdentifier.length > 0
  }
  return true
}

export function hasCompletedDates(state: TenancyBuilderState): boolean {
  const d = state.dates
  if (!d?.startDate) return false
  if (d.hasAgreedEndDate === 'no') return true
  if (d.hasAgreedEndDate === 'yes' && d.endDate) return true
  return false
}

// The earliest missing (or blocking) stage the user needs to complete before
// they can view the requested stage. Returns undefined if the requested stage
// is reachable given the current state.
export function findEarliestMissing(
  state: TenancyBuilderState,
  requested: StageKey,
): StageKey | undefined {
  const order: StageKey[] = ['scope', 'landlords', 'agent', 'tenants', 'home', 'dates']
  const requestedIndex = order.indexOf(requested)
  const gates: { key: StageKey; ok: (s: TenancyBuilderState) => boolean }[] = [
    { key: 'scope', ok: isSuitableScope },
    { key: 'landlords', ok: hasCompletedLandlords },
    { key: 'agent', ok: hasCompletedAgent },
    { key: 'tenants', ok: hasCompletedTenants },
    { key: 'home', ok: hasCompletedHome },
    { key: 'dates', ok: hasCompletedDates },
  ]
  for (const gate of gates) {
    const gateIndex = order.indexOf(gate.key)
    if (gateIndex >= requestedIndex) return undefined
    if (!gate.ok(state)) return gate.key
  }
  return undefined
}
