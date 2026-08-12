import { createContext, useContext } from 'react'

// Non-component exports for the tenancy-builder state: types, storage helpers
// and the context/hook. The Provider component lives alongside in
// TenancyBuilder.tsx. Split to keep react-refresh happy.
//
// The state grows one slice at a time as later stages are built. Every slice
// is sanitised independently on load so a bad slice cannot corrupt unrelated
// valid answers. IDs live only in memory + sessionStorage; they are never
// placed in URLs and never shown to users.

export const STORAGE_KEY = 'gov-bb.tenancy-builder.v1'

// -- Scope --------------------------------------------------------------------

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

// -- Party details (landlord, tenant, agent) ----------------------------------

export type PartyType = 'person' | 'organisation'

export type Parish =
  | 'christ-church'
  | 'saint-andrew'
  | 'saint-george'
  | 'saint-james'
  | 'saint-john'
  | 'saint-joseph'
  | 'saint-lucy'
  | 'saint-michael'
  | 'saint-peter'
  | 'saint-philip'
  | 'saint-thomas'

export const PARISHES: { value: Parish; label: string }[] = [
  { value: 'christ-church', label: 'Christ Church' },
  { value: 'saint-andrew', label: 'Saint Andrew' },
  { value: 'saint-george', label: 'Saint George' },
  { value: 'saint-james', label: 'Saint James' },
  { value: 'saint-john', label: 'Saint John' },
  { value: 'saint-joseph', label: 'Saint Joseph' },
  { value: 'saint-lucy', label: 'Saint Lucy' },
  { value: 'saint-michael', label: 'Saint Michael' },
  { value: 'saint-peter', label: 'Saint Peter' },
  { value: 'saint-philip', label: 'Saint Philip' },
  { value: 'saint-thomas', label: 'Saint Thomas' },
]

export interface PersonName {
  firstName: string
  middleNames?: string
  lastName: string
}

export interface BarbadosAddress {
  addressLine1: string
  addressLine2?: string
  townOrArea: string
  parish: Parish
}

export interface OverseasAddress {
  addressLine1: string
  addressLine2?: string
  townOrCity: string
  country: string
}

export interface PartyAddress {
  isInBarbados: YesNo
  barbados?: BarbadosAddress
  overseas?: OverseasAddress
}

export interface LandlordRecord {
  id: string
  partyType: PartyType
  personName?: PersonName
  organisationName?: string
  address: PartyAddress
}

export interface TenantRecord {
  id: string
  partyType: PartyType
  personName?: PersonName
  organisationName?: string
}

export interface AgentDetails {
  partyType: PartyType
  personName?: PersonName
  organisationName?: string
  address: PartyAddress
}

export interface AgentStage {
  hasAgent: YesNo
  details?: AgentDetails
}

// -- Home ---------------------------------------------------------------------

export interface HomeStage {
  address: BarbadosAddress
  // Required when scope.whatIsRented === 'self-contained-part'
  selfContainedIdentifier?: string
  // Optional when scope.whatIsRented === 'house-apartment'
  optionalIdentifier?: string
}

// -- Dates --------------------------------------------------------------------

export interface DateFields {
  day: string
  month: string
  year: string
}

export interface DatesStage {
  startDate: DateFields
  hasAgreedEndDate: YesNo
  endDate?: DateFields
}

// -- Rent ---------------------------------------------------------------------

export type RentFrequency = 'weekly' | 'every-2-weeks' | 'monthly' | 'other'

export interface RentStage {
  // Raw amount string as entered (validated as a plain BDS number, e.g. "1200"
  // or "1200.00"). No display formatting is applied or stored.
  amount: string
  frequency: RentFrequency
  // Required only when frequency === 'other'.
  otherFrequency?: string
  firstPaymentDue: DateFields
}

// -- Payment ------------------------------------------------------------------

export type PaymentMethod = 'cash' | 'bank-transfer' | 'cheque' | 'other'
export type RentRecipient = 'landlord' | 'agent'

export interface PaymentStage {
  // One or more agreed methods.
  methods: PaymentMethod[]
  // Required only when methods includes 'other'.
  otherMethod?: string
  // Asked only when an agent was recorded; otherwise derived as 'landlord'.
  // May be temporarily absent if an agent change invalidated an 'agent' value.
  recipient?: RentRecipient
}

// -- Editing (in-progress records) --------------------------------------------

// A draft party record while the user is editing. The `id` field is only
// present when the user is editing an existing completed landlord/tenant.
// When adding a new record, id is undefined until Save is pressed.
export interface LandlordDraft {
  editingId?: string
  partyType?: PartyType
  personName?: PersonName
  organisationName?: string
  address?: PartyAddress
}

export interface TenantDraft {
  editingId?: string
  partyType?: PartyType
  personName?: PersonName
  organisationName?: string
}

export interface AgentDraft {
  partyType?: PartyType
  personName?: PersonName
  organisationName?: string
  address?: PartyAddress
}

export interface EditingState {
  landlordDraft?: LandlordDraft
  tenantDraft?: TenantDraft
  agentDraft?: AgentDraft
}

// -- Top-level state ----------------------------------------------------------

export interface TenancyBuilderState {
  scope?: ScopeAnswers
  landlords?: LandlordRecord[]
  agent?: AgentStage
  tenants?: TenantRecord[]
  home?: HomeStage
  dates?: DatesStage
  rent?: RentStage
  payment?: PaymentStage
  editing?: EditingState
}

export interface TenancyBuilderContextValue {
  state: TenancyBuilderState
  storageAvailable: boolean
  // Scope
  setScope: (patch: Partial<ScopeAnswers>) => void
  // Landlords
  setLandlordDraft: (patch: Partial<LandlordDraft>) => void
  clearLandlordDraft: () => void
  saveLandlordDraft: () => void
  removeLandlord: (id: string) => void
  startEditingLandlord: (id: string) => void
  // Tenants
  setTenantDraft: (patch: Partial<TenantDraft>) => void
  clearTenantDraft: () => void
  saveTenantDraft: () => void
  removeTenant: (id: string) => void
  startEditingTenant: (id: string) => void
  // Agent
  setAgentAnswer: (answer: YesNo) => void
  setAgentDraft: (patch: Partial<AgentDraft>) => void
  clearAgentDraft: () => void
  saveAgentDraft: () => void
  // Home
  saveHome: (home: HomeStage) => void
  // Dates
  saveDates: (dates: DatesStage) => void
  setHasAgreedEndDate: (answer: YesNo) => void
  // Rent and payment
  saveRent: (rent: RentStage) => void
  savePayment: (payment: PaymentStage) => void
  // Downstream clearing
  clearFromLandlordsOnwards: () => void
  clearAgent: () => void
  clearHomeIdentifiers: (whatIsRented: WhatIsRented) => void
  // Reset
  resetAll: () => void
}

export const TenancyBuilderContext = createContext<TenancyBuilderContextValue | null>(null)

// -- Enum allow-lists ---------------------------------------------------------

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
const PARTY_TYPE_VALUES: PartyType[] = ['person', 'organisation']
const PARISH_VALUES: Parish[] = PARISHES.map((p) => p.value)
const RENT_FREQUENCY_VALUES: RentFrequency[] = ['weekly', 'every-2-weeks', 'monthly', 'other']
const PAYMENT_METHOD_VALUES: PaymentMethod[] = ['cash', 'bank-transfer', 'cheque', 'other']
const RENT_RECIPIENT_VALUES: RentRecipient[] = ['landlord', 'agent']

// -- Sanitisation helpers -----------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sanitiseEnum<T extends string>(value: unknown, allowed: T[]): T | undefined {
  return typeof value === 'string' && (allowed as string[]).includes(value) ? (value as T) : undefined
}

function sanitiseString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function sanitiseNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function sanitiseScope(raw: unknown): ScopeAnswers | undefined {
  if (!isPlainObject(raw)) return undefined
  const cleaned: ScopeAnswers = {
    forRentingHomeBarbados: sanitiseEnum(raw.forRentingHomeBarbados, YES_NO_VALUES),
    whatIsRented: sanitiseEnum(raw.whatIsRented, WHAT_IS_RENTED_VALUES),
    privateHomeOnly: sanitiseEnum(raw.privateHomeOnly, YES_NO_VALUES),
    agreementSituation: sanitiseEnum(raw.agreementSituation, AGREEMENT_SITUATION_VALUES),
  }
  return Object.values(cleaned).some((v) => v !== undefined) ? cleaned : undefined
}

function sanitisePersonName(raw: unknown): PersonName | undefined {
  if (!isPlainObject(raw)) return undefined
  const firstName = sanitiseNonEmptyString(raw.firstName)
  const lastName = sanitiseNonEmptyString(raw.lastName)
  if (!firstName || !lastName) return undefined
  const middleNames = sanitiseString(raw.middleNames)
  const result: PersonName = { firstName, lastName }
  if (middleNames) result.middleNames = middleNames
  return result
}

function sanitiseBarbadosAddress(raw: unknown): BarbadosAddress | undefined {
  if (!isPlainObject(raw)) return undefined
  const addressLine1 = sanitiseNonEmptyString(raw.addressLine1)
  const townOrArea = sanitiseNonEmptyString(raw.townOrArea)
  const parish = sanitiseEnum(raw.parish, PARISH_VALUES)
  if (!addressLine1 || !townOrArea || !parish) return undefined
  const result: BarbadosAddress = { addressLine1, townOrArea, parish }
  const addressLine2 = sanitiseString(raw.addressLine2)
  if (addressLine2) result.addressLine2 = addressLine2
  return result
}

function sanitiseOverseasAddress(raw: unknown): OverseasAddress | undefined {
  if (!isPlainObject(raw)) return undefined
  const addressLine1 = sanitiseNonEmptyString(raw.addressLine1)
  const townOrCity = sanitiseNonEmptyString(raw.townOrCity)
  const country = sanitiseNonEmptyString(raw.country)
  if (!addressLine1 || !townOrCity || !country) return undefined
  const result: OverseasAddress = { addressLine1, townOrCity, country }
  const addressLine2 = sanitiseString(raw.addressLine2)
  if (addressLine2) result.addressLine2 = addressLine2
  return result
}

function sanitisePartyAddress(raw: unknown): PartyAddress | undefined {
  if (!isPlainObject(raw)) return undefined
  const isInBarbados = sanitiseEnum(raw.isInBarbados, YES_NO_VALUES)
  if (!isInBarbados) return undefined
  if (isInBarbados === 'yes') {
    const barbados = sanitiseBarbadosAddress(raw.barbados)
    if (!barbados) return undefined
    return { isInBarbados, barbados }
  }
  const overseas = sanitiseOverseasAddress(raw.overseas)
  if (!overseas) return undefined
  return { isInBarbados, overseas }
}

function sanitiseLandlord(raw: unknown): LandlordRecord | undefined {
  if (!isPlainObject(raw)) return undefined
  const id = sanitiseNonEmptyString(raw.id)
  const partyType = sanitiseEnum(raw.partyType, PARTY_TYPE_VALUES)
  const address = sanitisePartyAddress(raw.address)
  if (!id || !partyType || !address) return undefined
  if (partyType === 'person') {
    const personName = sanitisePersonName(raw.personName)
    if (!personName) return undefined
    return { id, partyType, personName, address }
  }
  const organisationName = sanitiseNonEmptyString(raw.organisationName)
  if (!organisationName) return undefined
  return { id, partyType, organisationName, address }
}

function sanitiseTenant(raw: unknown): TenantRecord | undefined {
  if (!isPlainObject(raw)) return undefined
  const id = sanitiseNonEmptyString(raw.id)
  const partyType = sanitiseEnum(raw.partyType, PARTY_TYPE_VALUES)
  if (!id || !partyType) return undefined
  if (partyType === 'person') {
    const personName = sanitisePersonName(raw.personName)
    if (!personName) return undefined
    return { id, partyType, personName }
  }
  const organisationName = sanitiseNonEmptyString(raw.organisationName)
  if (!organisationName) return undefined
  return { id, partyType, organisationName }
}

function sanitiseLandlords(raw: unknown): LandlordRecord[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const cleaned = raw.map(sanitiseLandlord).filter((r): r is LandlordRecord => r !== undefined)
  return cleaned.length > 0 ? cleaned : undefined
}

function sanitiseTenants(raw: unknown): TenantRecord[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const cleaned = raw.map(sanitiseTenant).filter((r): r is TenantRecord => r !== undefined)
  return cleaned.length > 0 ? cleaned : undefined
}

function sanitiseAgentDetails(raw: unknown): AgentDetails | undefined {
  if (!isPlainObject(raw)) return undefined
  const partyType = sanitiseEnum(raw.partyType, PARTY_TYPE_VALUES)
  const address = sanitisePartyAddress(raw.address)
  if (!partyType || !address) return undefined
  if (partyType === 'person') {
    const personName = sanitisePersonName(raw.personName)
    if (!personName) return undefined
    return { partyType, personName, address }
  }
  const organisationName = sanitiseNonEmptyString(raw.organisationName)
  if (!organisationName) return undefined
  return { partyType, organisationName, address }
}

function sanitiseAgent(raw: unknown): AgentStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const hasAgent = sanitiseEnum(raw.hasAgent, YES_NO_VALUES)
  if (!hasAgent) return undefined
  if (hasAgent === 'no') return { hasAgent }
  const details = sanitiseAgentDetails(raw.details)
  if (!details) return { hasAgent } // partially known — not complete
  return { hasAgent, details }
}

function sanitiseHome(raw: unknown): HomeStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const address = sanitiseBarbadosAddress(raw.address)
  if (!address) return undefined
  const result: HomeStage = { address }
  const sci = sanitiseNonEmptyString(raw.selfContainedIdentifier)
  if (sci) result.selfContainedIdentifier = sci
  const oi = sanitiseNonEmptyString(raw.optionalIdentifier)
  if (oi) result.optionalIdentifier = oi
  return result
}

function sanitiseDateFields(raw: unknown): DateFields | undefined {
  if (!isPlainObject(raw)) return undefined
  const day = sanitiseString(raw.day)
  const month = sanitiseString(raw.month)
  const year = sanitiseString(raw.year)
  if (day === undefined || month === undefined || year === undefined) return undefined
  return { day, month, year }
}

function sanitiseDates(raw: unknown): DatesStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const startDate = sanitiseDateFields(raw.startDate)
  const hasAgreedEndDate = sanitiseEnum(raw.hasAgreedEndDate, YES_NO_VALUES)
  if (!startDate || !hasAgreedEndDate) return undefined
  if (hasAgreedEndDate === 'no') return { startDate, hasAgreedEndDate }
  const endDate = sanitiseDateFields(raw.endDate)
  if (!endDate) return { startDate, hasAgreedEndDate } // incomplete
  return { startDate, hasAgreedEndDate, endDate }
}

// Validation-only parse of a rent amount string. This is NOT display
// formatting: it accepts a plain number with up to two decimal places (e.g.
// "1200" or "1200.00") and returns the numeric value, or null if the string is
// not a valid amount.
export function parseRentAmount(raw: string): number | null {
  const trimmed = raw.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

function sanitiseRent(raw: unknown): RentStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const amount = sanitiseNonEmptyString(raw.amount)
  const frequency = sanitiseEnum(raw.frequency, RENT_FREQUENCY_VALUES)
  const firstPaymentDue = sanitiseDateFields(raw.firstPaymentDue)
  if (!amount || !frequency || !firstPaymentDue) return undefined
  const parsed = parseRentAmount(amount)
  if (parsed === null || parsed <= 0) return undefined
  const result: RentStage = { amount, frequency, firstPaymentDue }
  const otherFrequency = sanitiseNonEmptyString(raw.otherFrequency)
  if (otherFrequency) result.otherFrequency = otherFrequency
  return result
}

function sanitisePayment(raw: unknown): PaymentStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const rawMethods = Array.isArray(raw.methods) ? raw.methods : []
  const seen = rawMethods
    .map((m) => sanitiseEnum(m, PAYMENT_METHOD_VALUES))
    .filter((m): m is PaymentMethod => m !== undefined)
  // De-duplicate while pinning to the canonical option order.
  const methods = PAYMENT_METHOD_VALUES.filter((m) => seen.includes(m))
  if (methods.length === 0) return undefined
  const result: PaymentStage = { methods }
  const otherMethod = sanitiseNonEmptyString(raw.otherMethod)
  if (otherMethod) result.otherMethod = otherMethod
  const recipient = sanitiseEnum(raw.recipient, RENT_RECIPIENT_VALUES)
  if (recipient) result.recipient = recipient
  return result
}

// Editing drafts intentionally accept partial data — they represent
// in-progress work that has not been validated yet.
function sanitiseLandlordDraft(raw: unknown): LandlordDraft | undefined {
  if (!isPlainObject(raw)) return undefined
  const draft: LandlordDraft = {}
  const editingId = sanitiseNonEmptyString(raw.editingId)
  if (editingId) draft.editingId = editingId
  const partyType = sanitiseEnum(raw.partyType, PARTY_TYPE_VALUES)
  if (partyType) draft.partyType = partyType
  if (isPlainObject(raw.personName)) {
    const firstName = sanitiseString(raw.personName.firstName)
    const middleNames = sanitiseString(raw.personName.middleNames)
    const lastName = sanitiseString(raw.personName.lastName)
    const pn: Partial<PersonName> = {}
    if (firstName !== undefined) pn.firstName = firstName
    if (middleNames !== undefined) pn.middleNames = middleNames
    if (lastName !== undefined) pn.lastName = lastName
    if (Object.keys(pn).length > 0) draft.personName = pn as PersonName
  }
  const organisationName = sanitiseString(raw.organisationName)
  if (organisationName !== undefined) draft.organisationName = organisationName
  if (isPlainObject(raw.address)) {
    const isInBarbados = sanitiseEnum(raw.address.isInBarbados, YES_NO_VALUES)
    const partial: PartyAddress = { isInBarbados: isInBarbados ?? 'yes' } as PartyAddress
    if (isInBarbados) partial.isInBarbados = isInBarbados
    if (isPlainObject(raw.address.barbados)) {
      const b = raw.address.barbados
      partial.barbados = {
        addressLine1: sanitiseString(b.addressLine1) ?? '',
        addressLine2: sanitiseString(b.addressLine2),
        townOrArea: sanitiseString(b.townOrArea) ?? '',
        parish: sanitiseEnum(b.parish, PARISH_VALUES) ?? ('' as Parish),
      }
    }
    if (isPlainObject(raw.address.overseas)) {
      const o = raw.address.overseas
      partial.overseas = {
        addressLine1: sanitiseString(o.addressLine1) ?? '',
        addressLine2: sanitiseString(o.addressLine2),
        townOrCity: sanitiseString(o.townOrCity) ?? '',
        country: sanitiseString(o.country) ?? '',
      }
    }
    if (isInBarbados) draft.address = partial
  }
  return Object.keys(draft).length > 0 ? draft : undefined
}

function sanitiseTenantDraft(raw: unknown): TenantDraft | undefined {
  if (!isPlainObject(raw)) return undefined
  const draft: TenantDraft = {}
  const editingId = sanitiseNonEmptyString(raw.editingId)
  if (editingId) draft.editingId = editingId
  const partyType = sanitiseEnum(raw.partyType, PARTY_TYPE_VALUES)
  if (partyType) draft.partyType = partyType
  if (isPlainObject(raw.personName)) {
    const firstName = sanitiseString(raw.personName.firstName)
    const middleNames = sanitiseString(raw.personName.middleNames)
    const lastName = sanitiseString(raw.personName.lastName)
    const pn: Partial<PersonName> = {}
    if (firstName !== undefined) pn.firstName = firstName
    if (middleNames !== undefined) pn.middleNames = middleNames
    if (lastName !== undefined) pn.lastName = lastName
    if (Object.keys(pn).length > 0) draft.personName = pn as PersonName
  }
  const organisationName = sanitiseString(raw.organisationName)
  if (organisationName !== undefined) draft.organisationName = organisationName
  return Object.keys(draft).length > 0 ? draft : undefined
}

function sanitiseAgentDraft(raw: unknown): AgentDraft | undefined {
  if (!isPlainObject(raw)) return undefined
  const draft: AgentDraft = {}
  const partyType = sanitiseEnum(raw.partyType, PARTY_TYPE_VALUES)
  if (partyType) draft.partyType = partyType
  if (isPlainObject(raw.personName)) {
    const firstName = sanitiseString(raw.personName.firstName)
    const middleNames = sanitiseString(raw.personName.middleNames)
    const lastName = sanitiseString(raw.personName.lastName)
    const pn: Partial<PersonName> = {}
    if (firstName !== undefined) pn.firstName = firstName
    if (middleNames !== undefined) pn.middleNames = middleNames
    if (lastName !== undefined) pn.lastName = lastName
    if (Object.keys(pn).length > 0) draft.personName = pn as PersonName
  }
  const organisationName = sanitiseString(raw.organisationName)
  if (organisationName !== undefined) draft.organisationName = organisationName
  if (isPlainObject(raw.address)) {
    const isInBarbados = sanitiseEnum(raw.address.isInBarbados, YES_NO_VALUES)
    if (isInBarbados) {
      const partial: PartyAddress = { isInBarbados }
      if (isPlainObject(raw.address.barbados)) {
        const b = raw.address.barbados
        partial.barbados = {
          addressLine1: sanitiseString(b.addressLine1) ?? '',
          addressLine2: sanitiseString(b.addressLine2),
          townOrArea: sanitiseString(b.townOrArea) ?? '',
          parish: sanitiseEnum(b.parish, PARISH_VALUES) ?? ('' as Parish),
        }
      }
      if (isPlainObject(raw.address.overseas)) {
        const o = raw.address.overseas
        partial.overseas = {
          addressLine1: sanitiseString(o.addressLine1) ?? '',
          addressLine2: sanitiseString(o.addressLine2),
          townOrCity: sanitiseString(o.townOrCity) ?? '',
          country: sanitiseString(o.country) ?? '',
        }
      }
      draft.address = partial
    }
  }
  return Object.keys(draft).length > 0 ? draft : undefined
}

function sanitiseEditing(raw: unknown): EditingState | undefined {
  if (!isPlainObject(raw)) return undefined
  const editing: EditingState = {}
  const ld = sanitiseLandlordDraft(raw.landlordDraft)
  if (ld) editing.landlordDraft = ld
  const td = sanitiseTenantDraft(raw.tenantDraft)
  if (td) editing.tenantDraft = td
  const ad = sanitiseAgentDraft(raw.agentDraft)
  if (ad) editing.agentDraft = ad
  return Object.keys(editing).length > 0 ? editing : undefined
}

export function readInitialState(): TenancyBuilderState {
  if (typeof window === 'undefined') return {}
  let raw: unknown
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    raw = JSON.parse(stored)
  } catch {
    return {}
  }
  if (!isPlainObject(raw)) return {}
  // Each slice is sanitised independently: an invalid slice is dropped but
  // valid siblings are preserved.
  const state: TenancyBuilderState = {}
  const scope = sanitiseScope(raw.scope)
  if (scope) state.scope = scope
  const landlords = sanitiseLandlords(raw.landlords)
  if (landlords) state.landlords = landlords
  const agent = sanitiseAgent(raw.agent)
  if (agent) state.agent = agent
  const tenants = sanitiseTenants(raw.tenants)
  if (tenants) state.tenants = tenants
  const home = sanitiseHome(raw.home)
  if (home) state.home = home
  const dates = sanitiseDates(raw.dates)
  if (dates) state.dates = dates
  const rent = sanitiseRent(raw.rent)
  if (rent) state.rent = rent
  const payment = sanitisePayment(raw.payment)
  if (payment) state.payment = payment
  const editing = sanitiseEditing(raw.editing)
  if (editing) {
    // A draft that references a record we no longer have is unrecoverable —
    // discard the whole draft. Keeping its stale values would surface them
    // on the Add view under a fresh id. Valid drafts (no editingId, or
    // editingId matching an existing record) are preserved.
    if (
      editing.landlordDraft?.editingId &&
      !state.landlords?.some((l) => l.id === editing.landlordDraft?.editingId)
    ) {
      delete editing.landlordDraft
    }
    if (
      editing.tenantDraft?.editingId &&
      !state.tenants?.some((t) => t.id === editing.tenantDraft?.editingId)
    ) {
      delete editing.tenantDraft
    }
    if (Object.keys(editing).length > 0) state.editing = editing
  }
  return state
}

export function persist(state: TenancyBuilderState): void {
  if (typeof window === 'undefined') return
  try {
    // An empty state removes the key rather than persisting `"{}"`. This
    // keeps sessionStorage clean after Delete my answers and after a
    // just-mounted app that has never received a write.
    if (Object.keys(state).length === 0) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage unavailable — the app shows a visible warning; the journey
    // still works in memory for the current visit.
  }
}

export function useTenancyBuilder(): TenancyBuilderContextValue {
  const ctx = useContext(TenancyBuilderContext)
  if (!ctx) {
    throw new Error('useTenancyBuilder must be used inside <TenancyBuilderProvider>')
  }
  return ctx
}
