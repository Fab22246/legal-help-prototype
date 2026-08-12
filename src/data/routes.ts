// Route registry — the single source of truth for topic routes.
// Presentation (home cards, placeholder pages, router) reads from this so
// routes can be re-tagged and expanded later without touching components.

export type RouteType = 'guidance' | 'builder' | 'checker' | 'support' | 'placeholder'

export type RouteStatus =
  | 'planned'
  | 'draft'
  | 'readyForContentReview'
  | 'needsLegalReview'
  | 'readyForTesting'

export type LegalRisk = 'low' | 'medium' | 'high'

export type RouteGroup =
  | 'Wills and estates'
  | 'Homes, land and renting'
  | 'Documents, records and agreements'
  | 'Legal help and support'
  | 'Family and relationships'

export interface RouteMeta {
  /** Human-readable route/page title. */
  title: string
  /** Client-side route path. */
  path: string
  /** Home-page group this route belongs to. */
  group: RouteGroup
  /** Short description shown on the home card. */
  description: string
  /** Intended route behaviour (for later expansion). */
  routeType: RouteType
  /** Build/readiness status. */
  status: RouteStatus
  /** Legal-risk tag, for review prioritisation. */
  legalRisk: LegalRisk
  /** Whether the route appears as a card on the home page. */
  showOnHome: boolean

  // Optional per-route overrides for page-notice needs. When omitted, sensible
  // defaults are derived from routeType via getRouteNotices().
  /** Show the "draft wording has not been legally reviewed" warning. */
  needsDraftWarning?: boolean
  /** Show the "needs legal review before testing/publication" warning. */
  needsLegalReview?: boolean
  /** Whether a "relevant law and official sources" section may be shown. */
  showRelevantLaw?: boolean
}

// Order in which groups render on the home page.
export const groupOrder: RouteGroup[] = [
  'Wills and estates',
  'Homes, land and renting',
  'Documents, records and agreements',
  'Family and relationships',
  'Legal help and support',
]

// Every topic route is a placeholder for now (status: planned). routeType holds
// the intended behaviour so builders/guidance/checkers can be filled in later.
export const routes: RouteMeta[] = [
  {
    title: 'Plan what happens to my money and property',
    path: '/plan-money-property',
    group: 'Wills and estates',
    description:
      'Understand ways to prepare information about money, property and people who may need to be considered.',
    routeType: 'guidance',
    status: 'planned',
    legalRisk: 'medium',
    showOnHome: true,
  },
  {
    title: 'Prepare a simple will',
    path: '/simple-will',
    group: 'Wills and estates',
    description: 'Prepare information for a simple will if your situation is straightforward.',
    routeType: 'builder',
    status: 'planned',
    legalRisk: 'high',
    showOnHome: true,
  },
  {
    title: 'Find out what may be needed after someone dies',
    path: '/after-death',
    group: 'Wills and estates',
    description:
      'Check what information may be needed before asking about probate, letters of administration or estate matters.',
    routeType: 'checker',
    status: 'planned',
    legalRisk: 'high',
    showOnHome: true,
  },
  {
    title: 'Give land or a home while I am alive',
    path: '/give-property',
    group: 'Homes, land and renting',
    description: 'Understand what to check before giving land or a home to someone.',
    routeType: 'guidance',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: true,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: true,
  },
  {
    title: 'Renting a home',
    path: '/renting-home',
    group: 'Homes, land and renting',
    description:
      'Understand renting a home and what to check before signing a tenancy agreement.',
    routeType: 'guidance',
    status: 'needsLegalReview',
    legalRisk: 'medium',
    showOnHome: true,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: true,
  },
  {
    // Tenancy-agreement builder start page. Subordinate route (no home card).
    // The "Important" section on the page itself carries the draft-not-reviewed
    // and signing/sending/registration boundaries.
    title: 'Prepare a draft tenancy agreement',
    path: '/renting-home/agreement',
    group: 'Homes, land and renting',
    description:
      'Prepare a draft agreement for renting a home in Barbados. Discussion, information gathering and a draft only — the agreement is not signed, sent or registered.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Scope check for the tenancy-agreement builder. Same builder journey as
    // the start page — notices are not repeated here. Includes an inline
    // privacy explanation about tab-scoped sessionStorage.
    title: 'Check if you can prepare an agreement here',
    path: '/renting-home/agreement/scope',
    group: 'Homes, land and renting',
    description: 'Answer questions to check whether you can prepare a draft tenancy agreement here.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Landlord details — subordinate builder route with internal add / edit /
    // list views. Reached from the scope suitable outcome.
    title: 'Landlord details',
    path: '/renting-home/agreement/landlords',
    group: 'Homes, land and renting',
    description: 'Add every landlord who will be named in the agreement.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Optional agent or manager stage.
    title: 'Agent or manager',
    path: '/renting-home/agreement/agent',
    group: 'Homes, land and renting',
    description:
      'Answer whether someone will manage the tenancy for the landlord or landlords.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Tenant details — subordinate builder route with internal add / edit /
    // list views.
    title: 'Tenant details',
    path: '/renting-home/agreement/tenants',
    group: 'Homes, land and renting',
    description: 'Add every tenant who will be named in the agreement.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Details about the home being rented — Barbados address plus (for a
    // self-contained part) an identifying detail.
    title: 'Home being rented',
    path: '/renting-home/agreement/home',
    group: 'Homes, land and renting',
    description: 'Enter the address of the home being rented.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Tenancy dates. On save, continues to the rent stage.
    title: 'Tenancy dates',
    path: '/renting-home/agreement/dates',
    group: 'Homes, land and renting',
    description: 'Enter the tenancy start date and any agreed end date.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Rent details — subordinate builder route. Reached after tenancy dates.
    title: 'Rent details',
    path: '/renting-home/agreement/rent',
    group: 'Homes, land and renting',
    description: 'Enter the agreed rent amount, how often it is paid and when the first payment is due.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Payment details — subordinate builder route. Reached after rent details.
    // After saving, shows the relocated completion view.
    title: 'Payment details',
    path: '/renting-home/agreement/payment',
    group: 'Homes, land and renting',
    description: 'Enter how the agreed rent will be paid and who will receive it.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Deposit — subordinate builder route. Reached after payment details.
    title: 'Deposit',
    path: '/renting-home/agreement/deposit',
    group: 'Homes, land and renting',
    description: 'Record whether a deposit will be paid and the agreed deposit details.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // What happens to the deposit — only reached when a deposit will be paid.
    title: 'What happens to the deposit',
    path: '/renting-home/agreement/deposit-terms',
    group: 'Homes, land and renting',
    description: 'Record what has been agreed about the deposit at the end of the tenancy.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Bills and services — subordinate builder route with internal add / edit /
    // list views.
    title: 'Bills and services',
    path: '/renting-home/agreement/bills',
    group: 'Homes, land and renting',
    description: 'Record how bills and services for the home will be paid.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Other people living in the home — subordinate builder route with internal
    // add / edit / list views.
    title: 'Other people living in the home',
    path: '/renting-home/agreement/occupants',
    group: 'Homes, land and renting',
    description: 'Record anyone who will live in the home but is not named as a tenant.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Furniture and other items — subordinate builder route with internal add /
    // edit / list views.
    title: 'Furniture and other items',
    path: '/renting-home/agreement/included-items',
    group: 'Homes, land and renting',
    description: 'Record furniture, appliances or other items provided with the home.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Repairs — subordinate builder route capturing responsibilities, the first
    // repair contact and contact instructions.
    title: 'Repairs',
    path: '/renting-home/agreement/repairs',
    group: 'Homes, land and renting',
    description: 'Record how repairs will be handled and who to contact first.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Access to the home — subordinate builder route.
    title: 'Access to the home',
    path: '/renting-home/agreement/access',
    group: 'Homes, land and renting',
    description: 'Record what has been agreed about the landlord accessing the home.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Pets and smoking — subordinate builder route.
    title: 'Pets and smoking',
    path: '/renting-home/agreement/pets-smoking',
    group: 'Homes, land and renting',
    description: 'Record what is allowed about pets and smoking in the home.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Using the home — subordinate builder route.
    title: 'Using the home',
    path: '/renting-home/agreement/using-home',
    group: 'Homes, land and renting',
    description: 'Record what is allowed about running a business, making changes and subletting.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Ending the tenancy — subordinate builder route.
    title: 'Ending the tenancy',
    path: '/renting-home/agreement/ending',
    group: 'Homes, land and renting',
    description: 'Record what has been agreed about how or when the tenancy can end.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Other agreed points — subordinate builder route with internal add / edit /
    // list views.
    title: 'Other agreed points',
    path: '/renting-home/agreement/additional-terms',
    group: 'Homes, land and renting',
    description: 'Record anything else the landlords and tenants have agreed for a lawyer to check.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Safe exit for scope answers outside the builder's help. Signposts to
    // prepare-for-lawyer.
    title: 'You cannot prepare this agreement here',
    path: '/renting-home/agreement/not-suitable',
    group: 'Homes, land and renting',
    description:
      'Find out what to do when you cannot prepare the agreement here.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    title: 'Understand signing, witnessing and certified copies',
    path: '/signing-witnessing-certified-copies',
    group: 'Documents, records and agreements',
    description:
      'Learn what common legal document terms mean before you sign, witness, certify or notarise a document.',
    routeType: 'guidance',
    status: 'needsLegalReview',
    legalRisk: 'medium',
    showOnHome: true,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: true,
  },
  {
    title: 'Change a name or update a record',
    path: '/change-name-record',
    group: 'Documents, records and agreements',
    description: 'Find out where to start if you need to change a name or update a personal record.',
    routeType: 'guidance',
    status: 'needsLegalReview',
    legalRisk: 'medium',
    showOnHome: true,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: true,
  },
  {
    title: 'Prepare information before speaking to a lawyer',
    path: '/prepare-for-lawyer',
    group: 'Legal help and support',
    description: 'Gather useful information and questions before you speak to a lawyer.',
    routeType: 'support',
    status: 'readyForContentReview',
    legalRisk: 'low',
    showOnHome: true,
    needsDraftWarning: false,
    needsLegalReview: false,
    showRelevantLaw: false,
  },
  {
    title: 'Ask about legal aid',
    path: '/legal-aid',
    group: 'Legal help and support',
    description: 'Understand what legal aid is and how to ask Community Legal Services about it.',
    routeType: 'support',
    status: 'needsLegalReview',
    legalRisk: 'medium',
    showOnHome: true,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: true,
  },
  {
    title: 'I am not sure what I need',
    path: '/help-me-choose',
    group: 'Legal help and support',
    description: 'Answer simple questions to find a useful place to start.',
    routeType: 'checker',
    status: 'planned',
    legalRisk: 'low',
    showOnHome: true,
  },
  {
    title: 'Prepare a draft confidentiality agreement',
    path: '/confidentiality-agreement',
    group: 'Documents, records and agreements',
    description:
      'Prepare draft confidentiality wording for review before sharing business or sensitive information.',
    routeType: 'builder',
    status: 'planned',
    legalRisk: 'high',
    showOnHome: true,
  },
  {
    title: 'Prepare for a relationship financial agreement',
    path: '/relationship-financial-agreement',
    group: 'Family and relationships',
    description:
      'Prepare information before speaking to a lawyer about money, property or support in a relationship.',
    routeType: 'support',
    status: 'planned',
    legalRisk: 'high',
    showOnHome: true,
  },
  {
    title: 'Prepare a parenting plan',
    path: '/parenting-plan',
    group: 'Family and relationships',
    description:
      'Prepare information about child arrangements before discussing next steps or getting legal advice.',
    routeType: 'builder',
    status: 'planned',
    legalRisk: 'high',
    showOnHome: true,
  },
]

export function getRouteByPath(path: string): RouteMeta | undefined {
  return routes.find((r) => r.path === path)
}

// Resolved set of page-notice needs for a route.
export interface RouteNotices {
  draftWarning: boolean
  legalReviewNeeded: boolean
  relevantLaw: boolean
}

// Sensible defaults per route type. A route can override any of these via its
// optional metadata flags. Keeps notice decisions in the data layer, not in
// presentation components.
const NOTICE_DEFAULTS: Record<RouteType, RouteNotices> = {
  guidance: { draftWarning: false, legalReviewNeeded: true, relevantLaw: true },
  builder: { draftWarning: true, legalReviewNeeded: true, relevantLaw: true },
  checker: { draftWarning: false, legalReviewNeeded: true, relevantLaw: true },
  support: { draftWarning: false, legalReviewNeeded: false, relevantLaw: false },
  placeholder: { draftWarning: false, legalReviewNeeded: false, relevantLaw: false },
}

// Returns the effective notices for a route: explicit metadata flags win,
// otherwise the routeType defaults apply.
export function getRouteNotices(route: RouteMeta): RouteNotices {
  const defaults = NOTICE_DEFAULTS[route.routeType]
  return {
    draftWarning: route.needsDraftWarning ?? defaults.draftWarning,
    legalReviewNeeded: route.needsLegalReview ?? defaults.legalReviewNeeded,
    relevantLaw: route.showRelevantLaw ?? defaults.relevantLaw,
  }
}
