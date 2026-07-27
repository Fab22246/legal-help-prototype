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
    title: 'Give property while I am alive',
    path: '/give-property',
    group: 'Wills, estates and property',
    description: 'Understand what to check before giving property to someone while you are alive.',
    routeType: 'guidance',
    status: 'planned',
    legalRisk: 'high',
    showOnHome: true,
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
      'Understand what a tenancy agreement covers, what to check before you rent, and how a draft agreement builder could work.',
    routeType: 'guidance',
    status: 'planned',
    legalRisk: 'medium',
    showOnHome: true,
  },
  {
    title: 'Understand signing, witnessing and certified copies',
    path: '/signing-witnessing-certified-copies',
    group: 'Documents and records',
    description:
      'Learn what common legal document terms mean before you sign, witness, certify or notarise a document.',
    routeType: 'guidance',
    status: 'planned',
    legalRisk: 'medium',
    showOnHome: true,
  },
  {
    title: 'Change a name or update a record',
    path: '/change-name-record',
    group: 'Documents and records',
    description: 'Find out where to start if you need to change a name or update a personal record.',
    routeType: 'guidance',
    status: 'planned',
    legalRisk: 'medium',
    showOnHome: true,
  },
  {
    title: 'Prepare information before speaking to a lawyer',
    path: '/prepare-for-lawyer',
    group: 'Legal help and support',
    description: 'Gather useful information and questions before you speak to a lawyer.',
    routeType: 'support',
    status: 'planned',
    legalRisk: 'low',
    showOnHome: true,
  },
  {
    title: 'Ask about legal aid',
    path: '/legal-aid',
    group: 'Legal help and support',
    description: 'Find out what information you may need before asking about legal aid.',
    routeType: 'support',
    status: 'planned',
    legalRisk: 'medium',
    showOnHome: true,
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
