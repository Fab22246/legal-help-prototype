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

// -- Shared: Yes / Not yet and party references -------------------------------

export type YesNotYet = 'yes' | 'not-yet'

// A reference to a chosen party for a recipient/contact question: a specific
// saved landlord, the agent, or a free-text "someone else".
export type PartyRefKind = 'landlord' | 'agent' | 'other'
export interface PartyRef {
  kind: PartyRefKind
  // Present only when kind === 'landlord'.
  landlordId?: string
  // Present only when kind === 'other'.
  name?: string
}

// -- Deposit ------------------------------------------------------------------

export interface DepositStage {
  willBePaid: YesNo
  // The following are set only when willBePaid === 'yes'.
  amount?: string
  paymentDate?: DateFields
  recipient?: PartyRef
}

export interface DepositTermsStage {
  agreed: YesNotYet
  // Set only when agreed === 'yes'. User-supplied wording.
  wording?: string
}

// -- Bills and services -------------------------------------------------------

export type BillService =
  | 'water'
  | 'electricity'
  | 'gas'
  | 'internet'
  | 'television'
  | 'waste'
  | 'gardening'
  | 'cleaning'
  | 'security'
  | 'other'

export type BillArrangement =
  | 'included-in-rent'
  | 'tenant-direct'
  | 'tenant-pays-separately'
  | 'landlord-pays'
  | 'another-arrangement'

export type BillAmountBasis = 'fixed' | 'as-billed' | 'another-way'

export type BillFrequency =
  | 'weekly'
  | 'every-2-weeks'
  | 'monthly'
  | 'every-3-months'
  | 'every-6-months'
  | 'yearly'
  | 'other'

export interface BillRecord {
  id: string
  service: BillService
  otherServiceName?: string
  arrangement: BillArrangement
  // When arrangement === 'tenant-pays-separately':
  amountBasis?: BillAmountBasis
  fixedAmount?: string
  fixedFrequency?: BillFrequency
  otherFrequency?: string
  amountAnotherWay?: string
  whenToPay?: string
  // When arrangement === 'another-arrangement':
  arrangementDescription?: string
}

export interface BillsStage {
  agreed: YesNotYet
  records: BillRecord[]
}

export interface BillDraft {
  editingId?: string
  service?: BillService
  otherServiceName?: string
  arrangement?: BillArrangement
  amountBasis?: BillAmountBasis
  fixedAmount?: string
  fixedFrequency?: BillFrequency
  otherFrequency?: string
  amountAnotherWay?: string
  whenToPay?: string
  arrangementDescription?: string
}

// -- Other people living in the home ------------------------------------------

export interface OccupantRecord {
  id: string
  firstName: string
  middleNames?: string
  lastName: string
}

export interface OccupantsStage {
  willLive: YesNo
  records: OccupantRecord[]
}

export interface OccupantDraft {
  editingId?: string
  firstName?: string
  middleNames?: string
  lastName?: string
}

// -- Furniture and other items ------------------------------------------------

export interface ItemRecord {
  id: string
  item: string
  quantity: string
  location?: string
  conditionChecked: YesNotYet
  conditionDescription?: string
}

export interface ItemsStage {
  willProvide: YesNo
  records: ItemRecord[]
}

export interface ItemDraft {
  editingId?: string
  item?: string
  quantity?: string
  location?: string
  conditionChecked?: YesNotYet
  conditionDescription?: string
}

// -- Repairs ------------------------------------------------------------------

export interface RepairsStage {
  agreed: YesNotYet
  // Set only when agreed === 'yes'. User-supplied wording.
  arrangements?: string
  // The first repair contact (always asked).
  contact?: PartyRef
  // How to contact the repair contact (required once a contact is chosen).
  contactInstructions?: string
}

// -- Access to the home -------------------------------------------------------

export interface AccessStage {
  agreed: YesNotYet
  wording?: string
}

// -- Permissions (pets, smoking, using the home) ------------------------------

export type PermissionAnswer = 'yes' | 'written-permission' | 'no' | 'not-agreed-yet'

export interface PetsSmokingStage {
  pets: PermissionAnswer
  smoking: PermissionAnswer
}

export interface UsingHomeStage {
  business: PermissionAnswer
  changes: PermissionAnswer
  subletting: PermissionAnswer
}

// -- Ending the tenancy -------------------------------------------------------

export interface EndingStage {
  agreed: YesNotYet
  // Set only when agreed === 'yes'. User-supplied wording. Its meaning depends
  // on whether an agreed end date exists (ending early vs how the tenancy ends).
  wording?: string
}

// -- Other agreed points ------------------------------------------------------

export interface AdditionalTermRecord {
  id: string
  text: string
}

export interface AdditionalTermsStage {
  agreed: YesNo
  records: AdditionalTermRecord[]
}

export interface AdditionalTermDraft {
  editingId?: string
  text?: string
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
  billDraft?: BillDraft
  occupantDraft?: OccupantDraft
  itemDraft?: ItemDraft
  additionalTermDraft?: AdditionalTermDraft
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
  deposit?: DepositStage
  depositTerms?: DepositTermsStage
  bills?: BillsStage
  occupants?: OccupantsStage
  items?: ItemsStage
  repairs?: RepairsStage
  access?: AccessStage
  petsSmoking?: PetsSmokingStage
  usingHome?: UsingHomeStage
  ending?: EndingStage
  additionalTerms?: AdditionalTermsStage
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
  // Deposit
  saveDeposit: (deposit: DepositStage) => void
  confirmNoDeposit: () => void
  // Deposit terms
  saveDepositTerms: (depositTerms: DepositTermsStage) => void
  clearDepositTermsWording: () => void
  // Bills and services
  saveBillsAgreed: (agreed: YesNotYet) => void
  clearBillsRecords: () => void
  setBillDraft: (patch: Partial<BillDraft>) => void
  clearBillDraft: () => void
  saveBillDraft: () => void
  removeBill: (id: string) => void
  startEditingBill: (id: string) => void
  // Other people living in the home
  setOccupantsAnswer: (answer: YesNo) => void
  clearOccupantsRecords: () => void
  setOccupantDraft: (patch: Partial<OccupantDraft>) => void
  clearOccupantDraft: () => void
  saveOccupantDraft: () => void
  removeOccupant: (id: string) => void
  startEditingOccupant: (id: string) => void
  // Furniture and other items
  setItemsAnswer: (answer: YesNo) => void
  clearItemsRecords: () => void
  setItemDraft: (patch: Partial<ItemDraft>) => void
  clearItemDraft: () => void
  saveItemDraft: () => void
  removeItem: (id: string) => void
  startEditingItem: (id: string) => void
  // Repairs
  saveRepairs: (repairs: RepairsStage) => void
  // Access to the home
  saveAccess: (access: AccessStage) => void
  // Pets and smoking
  savePetsSmoking: (petsSmoking: PetsSmokingStage) => void
  // Using the home
  saveUsingHome: (usingHome: UsingHomeStage) => void
  // Ending the tenancy
  saveEnding: (ending: EndingStage) => void
  // Tenancy dates with ending cleared (used when adding/removing an end date
  // invalidates the earlier ending answer).
  saveDatesClearEnding: (dates: DatesStage) => void
  // Other agreed points
  setAdditionalTermsAnswer: (answer: YesNo) => void
  clearAdditionalTermsRecords: () => void
  setAdditionalTermDraft: (patch: Partial<AdditionalTermDraft>) => void
  clearAdditionalTermDraft: () => void
  saveAdditionalTermDraft: () => void
  removeAdditionalTerm: (id: string) => void
  startEditingAdditionalTerm: (id: string) => void
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
const YES_NOT_YET_VALUES: YesNotYet[] = ['yes', 'not-yet']
const PARTY_REF_KIND_VALUES: PartyRefKind[] = ['landlord', 'agent', 'other']
const PERMISSION_ANSWER_VALUES: PermissionAnswer[] = [
  'yes',
  'written-permission',
  'no',
  'not-agreed-yet',
]
const BILL_SERVICE_VALUES: BillService[] = [
  'water',
  'electricity',
  'gas',
  'internet',
  'television',
  'waste',
  'gardening',
  'cleaning',
  'security',
  'other',
]
const BILL_ARRANGEMENT_VALUES: BillArrangement[] = [
  'included-in-rent',
  'tenant-direct',
  'tenant-pays-separately',
  'landlord-pays',
  'another-arrangement',
]
const BILL_AMOUNT_BASIS_VALUES: BillAmountBasis[] = ['fixed', 'as-billed', 'another-way']
const BILL_FREQUENCY_VALUES: BillFrequency[] = [
  'weekly',
  'every-2-weeks',
  'monthly',
  'every-3-months',
  'every-6-months',
  'yearly',
  'other',
]

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

function sanitisePartyRef(raw: unknown): PartyRef | undefined {
  if (!isPlainObject(raw)) return undefined
  const kind = sanitiseEnum(raw.kind, PARTY_REF_KIND_VALUES)
  if (!kind) return undefined
  if (kind === 'landlord') {
    const landlordId = sanitiseNonEmptyString(raw.landlordId)
    if (!landlordId) return undefined
    return { kind, landlordId }
  }
  if (kind === 'other') {
    const name = sanitiseNonEmptyString(raw.name)
    if (!name) return undefined
    return { kind, name }
  }
  return { kind: 'agent' }
}

function sanitiseDeposit(raw: unknown): DepositStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const willBePaid = sanitiseEnum(raw.willBePaid, YES_NO_VALUES)
  if (!willBePaid) return undefined
  if (willBePaid === 'no') return { willBePaid }
  const result: DepositStage = { willBePaid }
  const amount = sanitiseNonEmptyString(raw.amount)
  if (amount) result.amount = amount
  const paymentDate = sanitiseDateFields(raw.paymentDate)
  if (paymentDate) result.paymentDate = paymentDate
  const recipient = sanitisePartyRef(raw.recipient)
  if (recipient) result.recipient = recipient
  return result
}

function sanitiseDepositTerms(raw: unknown): DepositTermsStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const agreed = sanitiseEnum(raw.agreed, YES_NOT_YET_VALUES)
  if (!agreed) return undefined
  const result: DepositTermsStage = { agreed }
  const wording = sanitiseNonEmptyString(raw.wording)
  if (wording) result.wording = wording
  return result
}

function sanitiseBillRecord(raw: unknown): BillRecord | undefined {
  if (!isPlainObject(raw)) return undefined
  const id = sanitiseNonEmptyString(raw.id)
  const service = sanitiseEnum(raw.service, BILL_SERVICE_VALUES)
  const arrangement = sanitiseEnum(raw.arrangement, BILL_ARRANGEMENT_VALUES)
  if (!id || !service || !arrangement) return undefined
  const result: BillRecord = { id, service, arrangement }
  if (service === 'other') {
    const otherServiceName = sanitiseNonEmptyString(raw.otherServiceName)
    if (!otherServiceName) return undefined
    result.otherServiceName = otherServiceName
  }
  if (arrangement === 'tenant-pays-separately') {
    const amountBasis = sanitiseEnum(raw.amountBasis, BILL_AMOUNT_BASIS_VALUES)
    if (!amountBasis) return undefined
    result.amountBasis = amountBasis
    if (amountBasis === 'fixed') {
      const fixedAmount = sanitiseNonEmptyString(raw.fixedAmount)
      const fixedFrequency = sanitiseEnum(raw.fixedFrequency, BILL_FREQUENCY_VALUES)
      if (!fixedAmount || !fixedFrequency) return undefined
      result.fixedAmount = fixedAmount
      result.fixedFrequency = fixedFrequency
      if (fixedFrequency === 'other') {
        const otherFrequency = sanitiseNonEmptyString(raw.otherFrequency)
        if (!otherFrequency) return undefined
        result.otherFrequency = otherFrequency
      }
    } else if (amountBasis === 'another-way') {
      const amountAnotherWay = sanitiseNonEmptyString(raw.amountAnotherWay)
      if (!amountAnotherWay) return undefined
      result.amountAnotherWay = amountAnotherWay
    }
    const whenToPay = sanitiseNonEmptyString(raw.whenToPay)
    if (!whenToPay) return undefined
    result.whenToPay = whenToPay
  }
  if (arrangement === 'another-arrangement') {
    const arrangementDescription = sanitiseNonEmptyString(raw.arrangementDescription)
    if (!arrangementDescription) return undefined
    result.arrangementDescription = arrangementDescription
  }
  return result
}

function sanitiseBills(raw: unknown): BillsStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const agreed = sanitiseEnum(raw.agreed, YES_NOT_YET_VALUES)
  if (!agreed) return undefined
  const rawRecords = Array.isArray(raw.records) ? raw.records : []
  const records = rawRecords
    .map(sanitiseBillRecord)
    .filter((r): r is BillRecord => r !== undefined)
  return { agreed, records }
}

function sanitiseBillDraft(raw: unknown): BillDraft | undefined {
  if (!isPlainObject(raw)) return undefined
  const draft: BillDraft = {}
  const editingId = sanitiseNonEmptyString(raw.editingId)
  if (editingId) draft.editingId = editingId
  const service = sanitiseEnum(raw.service, BILL_SERVICE_VALUES)
  if (service) draft.service = service
  const otherServiceName = sanitiseString(raw.otherServiceName)
  if (otherServiceName !== undefined) draft.otherServiceName = otherServiceName
  const arrangement = sanitiseEnum(raw.arrangement, BILL_ARRANGEMENT_VALUES)
  if (arrangement) draft.arrangement = arrangement
  const amountBasis = sanitiseEnum(raw.amountBasis, BILL_AMOUNT_BASIS_VALUES)
  if (amountBasis) draft.amountBasis = amountBasis
  const fixedAmount = sanitiseString(raw.fixedAmount)
  if (fixedAmount !== undefined) draft.fixedAmount = fixedAmount
  const fixedFrequency = sanitiseEnum(raw.fixedFrequency, BILL_FREQUENCY_VALUES)
  if (fixedFrequency) draft.fixedFrequency = fixedFrequency
  const otherFrequency = sanitiseString(raw.otherFrequency)
  if (otherFrequency !== undefined) draft.otherFrequency = otherFrequency
  const amountAnotherWay = sanitiseString(raw.amountAnotherWay)
  if (amountAnotherWay !== undefined) draft.amountAnotherWay = amountAnotherWay
  const whenToPay = sanitiseString(raw.whenToPay)
  if (whenToPay !== undefined) draft.whenToPay = whenToPay
  const arrangementDescription = sanitiseString(raw.arrangementDescription)
  if (arrangementDescription !== undefined) draft.arrangementDescription = arrangementDescription
  return Object.keys(draft).length > 0 ? draft : undefined
}

// Validation-only parse of a whole-number string (e.g. an item quantity).
export function parseWholeNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

function sanitiseOccupantRecord(raw: unknown): OccupantRecord | undefined {
  if (!isPlainObject(raw)) return undefined
  const id = sanitiseNonEmptyString(raw.id)
  const firstName = sanitiseNonEmptyString(raw.firstName)
  const lastName = sanitiseNonEmptyString(raw.lastName)
  if (!id || !firstName || !lastName) return undefined
  const result: OccupantRecord = { id, firstName, lastName }
  const middleNames = sanitiseNonEmptyString(raw.middleNames)
  if (middleNames) result.middleNames = middleNames
  return result
}

function sanitiseOccupants(raw: unknown): OccupantsStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const willLive = sanitiseEnum(raw.willLive, YES_NO_VALUES)
  if (!willLive) return undefined
  const rawRecords = Array.isArray(raw.records) ? raw.records : []
  const records = rawRecords
    .map(sanitiseOccupantRecord)
    .filter((r): r is OccupantRecord => r !== undefined)
  return { willLive, records }
}

function sanitiseOccupantDraft(raw: unknown): OccupantDraft | undefined {
  if (!isPlainObject(raw)) return undefined
  const draft: OccupantDraft = {}
  const editingId = sanitiseNonEmptyString(raw.editingId)
  if (editingId) draft.editingId = editingId
  const firstName = sanitiseString(raw.firstName)
  if (firstName !== undefined) draft.firstName = firstName
  const middleNames = sanitiseString(raw.middleNames)
  if (middleNames !== undefined) draft.middleNames = middleNames
  const lastName = sanitiseString(raw.lastName)
  if (lastName !== undefined) draft.lastName = lastName
  return Object.keys(draft).length > 0 ? draft : undefined
}

function sanitiseItemRecord(raw: unknown): ItemRecord | undefined {
  if (!isPlainObject(raw)) return undefined
  const id = sanitiseNonEmptyString(raw.id)
  const item = sanitiseNonEmptyString(raw.item)
  const quantity = sanitiseNonEmptyString(raw.quantity)
  const conditionChecked = sanitiseEnum(raw.conditionChecked, YES_NOT_YET_VALUES)
  if (!id || !item || !quantity || !conditionChecked) return undefined
  const q = parseWholeNumber(quantity)
  if (q === null || q <= 0) return undefined
  const result: ItemRecord = { id, item, quantity, conditionChecked }
  const location = sanitiseNonEmptyString(raw.location)
  if (location) result.location = location
  if (conditionChecked === 'yes') {
    const conditionDescription = sanitiseNonEmptyString(raw.conditionDescription)
    if (!conditionDescription) return undefined
    result.conditionDescription = conditionDescription
  }
  return result
}

function sanitiseItems(raw: unknown): ItemsStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const willProvide = sanitiseEnum(raw.willProvide, YES_NO_VALUES)
  if (!willProvide) return undefined
  const rawRecords = Array.isArray(raw.records) ? raw.records : []
  const records = rawRecords.map(sanitiseItemRecord).filter((r): r is ItemRecord => r !== undefined)
  return { willProvide, records }
}

function sanitiseItemDraft(raw: unknown): ItemDraft | undefined {
  if (!isPlainObject(raw)) return undefined
  const draft: ItemDraft = {}
  const editingId = sanitiseNonEmptyString(raw.editingId)
  if (editingId) draft.editingId = editingId
  const item = sanitiseString(raw.item)
  if (item !== undefined) draft.item = item
  const quantity = sanitiseString(raw.quantity)
  if (quantity !== undefined) draft.quantity = quantity
  const location = sanitiseString(raw.location)
  if (location !== undefined) draft.location = location
  const conditionChecked = sanitiseEnum(raw.conditionChecked, YES_NOT_YET_VALUES)
  if (conditionChecked) draft.conditionChecked = conditionChecked
  const conditionDescription = sanitiseString(raw.conditionDescription)
  if (conditionDescription !== undefined) draft.conditionDescription = conditionDescription
  return Object.keys(draft).length > 0 ? draft : undefined
}

function sanitiseRepairs(raw: unknown): RepairsStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const agreed = sanitiseEnum(raw.agreed, YES_NOT_YET_VALUES)
  if (!agreed) return undefined
  const result: RepairsStage = { agreed }
  if (agreed === 'yes') {
    const arrangements = sanitiseNonEmptyString(raw.arrangements)
    if (arrangements) result.arrangements = arrangements
  }
  const contact = sanitisePartyRef(raw.contact)
  if (contact) {
    result.contact = contact
    const contactInstructions = sanitiseNonEmptyString(raw.contactInstructions)
    if (contactInstructions) result.contactInstructions = contactInstructions
  }
  return result
}

function sanitiseAccess(raw: unknown): AccessStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const agreed = sanitiseEnum(raw.agreed, YES_NOT_YET_VALUES)
  if (!agreed) return undefined
  const result: AccessStage = { agreed }
  const wording = sanitiseNonEmptyString(raw.wording)
  if (wording) result.wording = wording
  return result
}

function sanitisePetsSmoking(raw: unknown): PetsSmokingStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const pets = sanitiseEnum(raw.pets, PERMISSION_ANSWER_VALUES)
  const smoking = sanitiseEnum(raw.smoking, PERMISSION_ANSWER_VALUES)
  if (!pets || !smoking) return undefined
  return { pets, smoking }
}

function sanitiseUsingHome(raw: unknown): UsingHomeStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const business = sanitiseEnum(raw.business, PERMISSION_ANSWER_VALUES)
  const changes = sanitiseEnum(raw.changes, PERMISSION_ANSWER_VALUES)
  const subletting = sanitiseEnum(raw.subletting, PERMISSION_ANSWER_VALUES)
  if (!business || !changes || !subletting) return undefined
  return { business, changes, subletting }
}

function sanitiseEnding(raw: unknown): EndingStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const agreed = sanitiseEnum(raw.agreed, YES_NOT_YET_VALUES)
  if (!agreed) return undefined
  const result: EndingStage = { agreed }
  if (agreed === 'yes') {
    const wording = sanitiseNonEmptyString(raw.wording)
    if (wording) result.wording = wording
  }
  return result
}

function sanitiseAdditionalTermRecord(raw: unknown): AdditionalTermRecord | undefined {
  if (!isPlainObject(raw)) return undefined
  const id = sanitiseNonEmptyString(raw.id)
  const text = sanitiseNonEmptyString(raw.text)
  if (!id || !text) return undefined
  return { id, text }
}

function sanitiseAdditionalTerms(raw: unknown): AdditionalTermsStage | undefined {
  if (!isPlainObject(raw)) return undefined
  const agreed = sanitiseEnum(raw.agreed, YES_NO_VALUES)
  if (!agreed) return undefined
  const rawRecords = Array.isArray(raw.records) ? raw.records : []
  const records = rawRecords
    .map(sanitiseAdditionalTermRecord)
    .filter((r): r is AdditionalTermRecord => r !== undefined)
  return { agreed, records }
}

function sanitiseAdditionalTermDraft(raw: unknown): AdditionalTermDraft | undefined {
  if (!isPlainObject(raw)) return undefined
  const draft: AdditionalTermDraft = {}
  const editingId = sanitiseNonEmptyString(raw.editingId)
  if (editingId) draft.editingId = editingId
  const text = sanitiseString(raw.text)
  if (text !== undefined) draft.text = text
  return Object.keys(draft).length > 0 ? draft : undefined
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
  const bd = sanitiseBillDraft(raw.billDraft)
  if (bd) editing.billDraft = bd
  const od = sanitiseOccupantDraft(raw.occupantDraft)
  if (od) editing.occupantDraft = od
  const itd = sanitiseItemDraft(raw.itemDraft)
  if (itd) editing.itemDraft = itd
  const atd = sanitiseAdditionalTermDraft(raw.additionalTermDraft)
  if (atd) editing.additionalTermDraft = atd
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
  const deposit = sanitiseDeposit(raw.deposit)
  if (deposit) state.deposit = deposit
  const depositTerms = sanitiseDepositTerms(raw.depositTerms)
  if (depositTerms) state.depositTerms = depositTerms
  const bills = sanitiseBills(raw.bills)
  if (bills) state.bills = bills
  const occupants = sanitiseOccupants(raw.occupants)
  if (occupants) state.occupants = occupants
  const items = sanitiseItems(raw.items)
  if (items) state.items = items
  const repairs = sanitiseRepairs(raw.repairs)
  if (repairs) state.repairs = repairs
  const access = sanitiseAccess(raw.access)
  if (access) state.access = access
  const petsSmoking = sanitisePetsSmoking(raw.petsSmoking)
  if (petsSmoking) state.petsSmoking = petsSmoking
  const usingHome = sanitiseUsingHome(raw.usingHome)
  if (usingHome) state.usingHome = usingHome
  const ending = sanitiseEnding(raw.ending)
  if (ending) state.ending = ending
  const additionalTerms = sanitiseAdditionalTerms(raw.additionalTerms)
  if (additionalTerms) state.additionalTerms = additionalTerms
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
    if (
      editing.billDraft?.editingId &&
      !state.bills?.records.some((b) => b.id === editing.billDraft?.editingId)
    ) {
      delete editing.billDraft
    }
    if (
      editing.occupantDraft?.editingId &&
      !state.occupants?.records.some((o) => o.id === editing.occupantDraft?.editingId)
    ) {
      delete editing.occupantDraft
    }
    if (
      editing.itemDraft?.editingId &&
      !state.items?.records.some((it) => it.id === editing.itemDraft?.editingId)
    ) {
      delete editing.itemDraft
    }
    if (
      editing.additionalTermDraft?.editingId &&
      !state.additionalTerms?.records.some(
        (t) => t.id === editing.additionalTermDraft?.editingId,
      )
    ) {
      delete editing.additionalTermDraft
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
