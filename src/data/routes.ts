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
  | 'Wills, estates and property'
  | 'Renting and housing'
  | 'Documents and records'
  | 'Legal help and support'
  | 'Business and agreements'
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
  /** Show the "does not give legal advice" boundary notice on the page. */
  needsLegalAdviceBoundary?: boolean
  /** Show the "draft wording has not been legally reviewed" warning. */
  needsDraftWarning?: boolean
  /** Show the "needs legal review before testing/publication" warning. */
  needsLegalReview?: boolean
  /** Whether a "relevant law and official sources" section may be shown. */
  showRelevantLaw?: boolean
}

// Order in which groups render on the home page.
export const groupOrder: RouteGroup[] = [
  'Wills, estates and property',
  'Renting and housing',
  'Documents and records',
  'Legal help and support',
  'Business and agreements',
  'Family and relationships',
]

// Every topic route is a placeholder for now (status: planned). routeType holds
// the intended behaviour so builders/guidance/checkers can be filled in later.
export const routes: RouteMeta[] = [
  {
    title: 'Plan what happens to my money and property',
    path: '/plan-money-property',
    group: 'Wills, estates and property',
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
    group: 'Wills, estates and property',
    description: 'Prepare information for a simple will if your situation is straightforward.',
    routeType: 'builder',
    status: 'planned',
    legalRisk: 'high',
    showOnHome: true,
  },
  {
    title: 'Give land or a home while I am alive',
    path: '/give-property',
    group: 'Wills, estates and property',
    description: 'Understand what to check before giving land or a home to someone.',
    routeType: 'guidance',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: true,
    needsLegalAdviceBoundary: true,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: true,
  },
  {
    title: 'Find out what may be needed after someone dies',
    path: '/after-death',
    group: 'Wills, estates and property',
    description:
      'Check what information may be needed before asking about probate, letters of administration or estate matters.',
    routeType: 'checker',
    status: 'planned',
    legalRisk: 'high',
    showOnHome: true,
  },
  {
    title: 'Renting a home',
    path: '/renting-home',
    group: 'Renting and housing',
    description:
      'Understand renting a home and what to check before signing a tenancy agreement.',
    routeType: 'guidance',
    status: 'needsLegalReview',
    legalRisk: 'medium',
    showOnHome: true,
    needsLegalAdviceBoundary: true,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: true,
  },
  {
    // Tenancy-agreement builder start page. Subordinate route (no home card).
    // The "Important" section on the page itself carries the legal-advice and
    // unreviewed-draft boundaries so the scope page does not repeat them.
    title: 'Prepare a draft tenancy agreement',
    path: '/renting-home/agreement',
    group: 'Renting and housing',
    description:
      'Prepare a draft agreement for renting a home in Barbados. Discussion, information gathering and a draft only — the agreement is not signed, sent or registered.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsLegalAdviceBoundary: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Scope check for the tenancy-agreement builder. Same builder journey as
    // the start page — notices are not repeated here. Includes an inline
    // privacy explanation about tab-scoped sessionStorage.
    title: 'Check if this builder is suitable',
    path: '/renting-home/agreement/scope',
    group: 'Renting and housing',
    description: 'Check if the tenancy-agreement builder is suitable for this agreement.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsLegalAdviceBoundary: false,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    // Safe exit for scope answers outside the builder's help. Shows a
    // legal-advice boundary notice and signposts to prepare-for-lawyer.
    title: 'This builder cannot help with this agreement',
    path: '/renting-home/agreement/not-suitable',
    group: 'Renting and housing',
    description:
      'The tenancy-agreement builder cannot help with this arrangement. Signposts to next steps.',
    routeType: 'builder',
    status: 'needsLegalReview',
    legalRisk: 'high',
    showOnHome: false,
    needsLegalAdviceBoundary: true,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: false,
  },
  {
    title: 'Understand signing, witnessing and certified copies',
    path: '/signing-witnessing-certified-copies',
    group: 'Documents and records',
    description:
      'Learn what common legal document terms mean before you sign, witness, certify or notarise a document.',
    routeType: 'guidance',
    status: 'needsLegalReview',
    legalRisk: 'medium',
    showOnHome: true,
    needsLegalAdviceBoundary: true,
    needsDraftWarning: false,
    needsLegalReview: true,
    showRelevantLaw: true,
  },
  {
    title: 'Change a name or update a record',
    path: '/change-name-record',
    group: 'Documents and records',
    description: 'Find out where to start if you need to change a name or update a personal record.',
    routeType: 'guidance',
    status: 'needsLegalReview',
    legalRisk: 'medium',
    showOnHome: true,
    needsLegalAdviceBoundary: true,
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
    needsLegalAdviceBoundary: true,
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
    needsLegalAdviceBoundary: true,
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
    group: 'Business and agreements',
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
  legalAdviceBoundary: boolean
  draftWarning: boolean
  legalReviewNeeded: boolean
  relevantLaw: boolean
}

// Sensible defaults per route type. A route can override any of these via its
// optional metadata flags. Keeps notice decisions in the data layer, not in
// presentation components.
const NOTICE_DEFAULTS: Record<RouteType, RouteNotices> = {
  guidance: { legalAdviceBoundary: true, draftWarning: false, legalReviewNeeded: true, relevantLaw: true },
  builder: { legalAdviceBoundary: true, draftWarning: true, legalReviewNeeded: true, relevantLaw: true },
  checker: { legalAdviceBoundary: true, draftWarning: false, legalReviewNeeded: true, relevantLaw: true },
  support: { legalAdviceBoundary: true, draftWarning: false, legalReviewNeeded: false, relevantLaw: false },
  placeholder: { legalAdviceBoundary: true, draftWarning: false, legalReviewNeeded: false, relevantLaw: false },
}

// Returns the effective notices for a route: explicit metadata flags win,
// otherwise the routeType defaults apply.
export function getRouteNotices(route: RouteMeta): RouteNotices {
  const defaults = NOTICE_DEFAULTS[route.routeType]
  return {
    legalAdviceBoundary: route.needsLegalAdviceBoundary ?? defaults.legalAdviceBoundary,
    draftWarning: route.needsDraftWarning ?? defaults.draftWarning,
    legalReviewNeeded: route.needsLegalReview ?? defaults.legalReviewNeeded,
    relevantLaw: route.showRelevantLaw ?? defaults.relevantLaw,
  }
}
