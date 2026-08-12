import { Routes, Route } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { HomePage } from '../pages/HomePage'
import { PlaceholderPage } from '../components/PlaceholderPage'
import { SigningWitnessingCertifiedCopiesPage } from '../pages/SigningWitnessingCertifiedCopiesPage'
import { ChangeNameRecordPage } from '../pages/ChangeNameRecordPage'
import { RentingHomePage } from '../pages/RentingHomePage'
import { PrepareForLawyerPage } from '../pages/PrepareForLawyerPage'
import { LegalAidPage } from '../pages/LegalAidPage'
import { GivePropertyPage } from '../pages/GivePropertyPage'
import { TenancyAgreementStartPage } from '../pages/TenancyAgreementStartPage'
import { TenancyAgreementScopePage } from '../pages/TenancyAgreementScopePage'
import { TenancyAgreementNotSuitablePage } from '../pages/TenancyAgreementNotSuitablePage'
import { TenancyAgreementLandlordsPage } from '../pages/TenancyAgreementLandlordsPage'
import { TenancyAgreementAgentPage } from '../pages/TenancyAgreementAgentPage'
import { TenancyAgreementTenantsPage } from '../pages/TenancyAgreementTenantsPage'
import { TenancyAgreementHomePage } from '../pages/TenancyAgreementHomePage'
import { TenancyAgreementDatesPage } from '../pages/TenancyAgreementDatesPage'
import { TenancyAgreementRentPage } from '../pages/TenancyAgreementRentPage'
import { TenancyAgreementPaymentPage } from '../pages/TenancyAgreementPaymentPage'
import { routes } from '../data/routes'

// Built routes render their own page; every other route still renders the
// registry-driven placeholder. Added one route at a time in later phases.
const BUILT_ROUTES: Record<string, ReactNode> = {
  '/signing-witnessing-certified-copies': <SigningWitnessingCertifiedCopiesPage />,
  '/change-name-record': <ChangeNameRecordPage />,
  '/renting-home': <RentingHomePage />,
  '/prepare-for-lawyer': <PrepareForLawyerPage />,
  '/legal-aid': <LegalAidPage />,
  '/give-property': <GivePropertyPage />,
  '/renting-home/agreement': <TenancyAgreementStartPage />,
  '/renting-home/agreement/scope': <TenancyAgreementScopePage />,
  '/renting-home/agreement/not-suitable': <TenancyAgreementNotSuitablePage />,
  '/renting-home/agreement/landlords': <TenancyAgreementLandlordsPage />,
  '/renting-home/agreement/agent': <TenancyAgreementAgentPage />,
  '/renting-home/agreement/tenants': <TenancyAgreementTenantsPage />,
  '/renting-home/agreement/home': <TenancyAgreementHomePage />,
  '/renting-home/agreement/dates': <TenancyAgreementDatesPage />,
  '/renting-home/agreement/rent': <TenancyAgreementRentPage />,
  '/renting-home/agreement/payment': <TenancyAgreementPaymentPage />,
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        {routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={BUILT_ROUTES[route.path] ?? <PlaceholderPage meta={route} />}
          />
        ))}
        <Route path="*" element={<PlaceholderPage notFound />} />
      </Route>
    </Routes>
  )
}
