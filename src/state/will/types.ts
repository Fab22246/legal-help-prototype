// Will-service data model. In-memory only; never persisted (see WillState).
// Shared across the route engine, clearing helpers, Check your answers mapping
// and the generated outputs.

export type YesNo = 'yes' | 'no'
export type YesNoNotSure = 'yes' | 'no' | 'not-sure'

export type RouteId = 'A' | 'B' | 'C'
export type TerminalId = 'T1' | 'T2' | 'T3' | 'T4'

export interface DateParts {
  day: string
  month: string
  year: string
}

export interface Name {
  firstName: string
  middleNames?: string
  lastName: string
}

export interface Address {
  line1: string
  line2?: string
  townOrCity: string
  parish?: string
  country: string
}

export type RecipientType = 'person' | 'organisation'

// Shared, reusable person record with a stable id. Role membership is derived
// from the reference arrays and structures in WillAnswers, not stored here, so a
// person can hold several roles and be preserved while any role still uses them.
export interface PersonRecord {
  id: string
  name: Name
  // Free-text relationship as entered, or the F2 "Other" description. The
  // spouse and partner roles supply their own relationship label at display.
  relationship?: string
  address?: Address
  dateOfBirth?: DateParts
  // Answer to "Is this person under 18?" when it had to be asked directly.
  under18Answer?: YesNoNotSure
  // F4 / F6 support description.
  supportProvided?: string
  // A12 "lived together continuously for 5 years or more".
  livedTogetherFiveYears?: YesNoNotSure
}

export interface OrganisationRecord {
  id: string
  legalName: string
  address?: Address
}

export type GiftKind = 'money' | 'item' | 'land' | 'other'
export type GiftFallback = 'to-estate' | 'to-replacement'

export interface Gift {
  id: string
  kind?: GiftKind
  amount?: string
  currency?: string
  description?: string
  recipientType?: RecipientType
  recipientPersonId?: string
  recipientOrgId?: string
  fallback?: GiftFallback
  replacementType?: RecipientType
  replacementPersonId?: string
  replacementOrgId?: string
}

export type RemainderFallback = 'share-among-others' | 'to-children' | 'to-replacement'

export interface RemainderBeneficiary {
  id: string
  recipientType?: RecipientType
  recipientPersonId?: string
  recipientOrgId?: string
  percentage?: string
  fallback?: RemainderFallback
  replacementType?: RecipientType
  replacementPersonId?: string
  replacementOrgId?: string
}

// Route C "people and organisations to include".
export interface RouteCInclude {
  id: string
  recipientType?: RecipientType
  personId?: string
  orgId?: string
  roleText?: string
}

// Route C "money and property to discuss".
export interface RouteCAsset {
  id: string
  type: string
  description: string
  country: string
}

export interface JointAsset {
  id: string
  description: string
}

export type ReviewPoint =
  | 'FOREIGN_ASSETS'
  | 'MAIN_HOME_OUTSIDE_BARBADOS'
  | 'OTHER_CITIZENSHIP'
  | 'CURRENT_MARRIAGE'
  | 'MARRIED_SEPARATED'
  | 'UNMARRIED_PARTNER'
  | 'PLANNED_MARRIAGE'
  | 'MINOR_CHILD'
  | 'DEPENDANT_ADULT_CHILD'
  | 'OTHER_DEPENDANT'
  | 'JOINTLY_OWNED_ASSET'
  | 'BUSINESS_OWNERSHIP'
  | 'SPECIFIC_GIFT_OF_LAND'
  | 'MINOR_BENEFICIARY'
  | 'BENEFICIARY_CHILDREN_FALLBACK'
  | 'FAMILY_OR_DEPENDANT_NOT_INCLUDED'

export type IssueCode =
  | 'JOINT_WILL'
  | 'EXISTING_WILL_UNCERTAIN'
  | 'EXISTING_WILL_NOT_REPLACED'
  | 'BUSINESS_SUCCESSION'
  | 'OWNERSHIP_DISPUTE'
  | 'LIFETIME_INTEREST'
  | 'CONDITIONAL_GIFT'
  | 'POSSIBLE_INSOLVENCY'

export interface WillAnswers {
  // Suitability
  s1?: YesNo
  // S2 records only a non-answer safeguarding marker, never an answer value.
  safeguardingScreen?: boolean
  s3?: YesNoNotSure
  s4?: YesNo
  s5?: YesNo
  s6?: YesNoNotSure
  s7?: YesNo

  // About you
  testatorName?: Name
  testatorAddress?: Address
  a3?: YesNoNotSure
  a4?: YesNoNotSure
  a4Countries: string[]
  a5?: YesNoNotSure
  a6?: YesNoNotSure
  a7?: YesNo
  spousePersonId?: string
  a9?: YesNo
  a10?: YesNoNotSure
  a11?: YesNo
  partnerPersonId?: string
  a13?: YesNoNotSure

  // Children and dependants
  f1?: YesNo
  minorChildIds: string[]
  f3?: YesNo
  dependantAdultChildIds: string[]
  f5?: YesNo
  otherDependantIds: string[]

  // Executors
  executorIds: string[]
  e3?: YesNo
  replacementExecutorIds: string[]

  // Guardians
  g1?: YesNo
  guardianIds: string[]
  g3?: YesNo
  replacementGuardianIds: string[]

  // Money and property circumstances
  p1?: YesNoNotSure
  jointAssets: JointAsset[]
  p3?: YesNo
  p4?: YesNoNotSure
  p5?: YesNo
  p6?: YesNoNotSure
  p7?: YesNoNotSure
  p8?: YesNoNotSure

  // Specific gifts
  sg1?: YesNo
  gifts: Gift[]

  // Remainder
  remainder: RemainderBeneficiary[]

  // Route C data
  cIssueText: Partial<Record<IssueCode, string>>
  cJointOtherName?: Name
  cIncludes: RouteCInclude[]
  cAssets: RouteCAsset[]
  cOther?: string

  // Whether the person has seen the Route C introduction (C1).
  cIntroSeen?: boolean

  // Shared registries
  people: PersonRecord[]
  organisations: OrganisationRecord[]

  // Output metadata (captured when a Create button is confirmed).
  dateCreated?: string
}

export function createEmptyAnswers(): WillAnswers {
  return {
    a4Countries: [],
    minorChildIds: [],
    dependantAdultChildIds: [],
    otherDependantIds: [],
    executorIds: [],
    replacementExecutorIds: [],
    guardianIds: [],
    replacementGuardianIds: [],
    jointAssets: [],
    gifts: [],
    remainder: [],
    cIssueText: {},
    cIncludes: [],
    cAssets: [],
    people: [],
    organisations: [],
  }
}

// Derived route result. Recomputed from answers on every change.
export interface WillDerived {
  terminal?: TerminalId
  route: RouteId
  reviewPoints: ReviewPoint[]
  issues: IssueCode[]
}
