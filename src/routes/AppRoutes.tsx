import { Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { HomePage } from '../pages/HomePage'
import { PlaceholderPage } from '../components/PlaceholderPage'
import { WillStateProvider } from '../state/will/WillState'
import { WillRoutes } from '../pages/will/WillRoutes'
import { WILL_BASE } from '../state/will/willPaths'
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
import { TenancyAgreementDepositPage } from '../pages/TenancyAgreementDepositPage'
import { TenancyAgreementDepositTermsPage } from '../pages/TenancyAgreementDepositTermsPage'
import { TenancyAgreementBillsPage } from '../pages/TenancyAgreementBillsPage'
import { TenancyAgreementOccupantsPage } from '../pages/TenancyAgreementOccupantsPage'
import { TenancyAgreementItemsPage } from '../pages/TenancyAgreementItemsPage'
import { TenancyAgreementRepairsPage } from '../pages/TenancyAgreementRepairsPage'
import { TenancyAgreementAccessPage } from '../pages/TenancyAgreementAccessPage'
import { TenancyAgreementPetsSmokingPage } from '../pages/TenancyAgreementPetsSmokingPage'
import { TenancyAgreementUsingHomePage } from '../pages/TenancyAgreementUsingHomePage'
import { TenancyAgreementEndingPage } from '../pages/TenancyAgreementEndingPage'
import { TenancyAgreementAdditionalTermsPage } from '../pages/TenancyAgreementAdditionalTermsPage'
import { routes } from '../data/routes'

// Built routes render their own page; every other route still renders the
// registry-driven placeholder. Added one route at a time in later phases.
const BUILT_ROUTES: Record<string, ReactNode> = {
  // The simple-will service entry opens the will-service journey.
  '/simple-will': <Navigate to={WILL_BASE} replace />,
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
  '/renting-home/agreement/deposit': <TenancyAgreementDepositPage />,
  '/renting-home/agreement/deposit-terms': <TenancyAgreementDepositTermsPage />,
  '/renting-home/agreement/bills': <TenancyAgreementBillsPage />,
  '/renting-home/agreement/occupants': <TenancyAgreementOccupantsPage />,
  '/renting-home/agreement/included-items': <TenancyAgreementItemsPage />,
  '/renting-home/agreement/repairs': <TenancyAgreementRepairsPage />,
  '/renting-home/agreement/access': <TenancyAgreementAccessPage />,
  '/renting-home/agreement/pets-smoking': <TenancyAgreementPetsSmokingPage />,
  '/renting-home/agreement/using-home': <TenancyAgreementUsingHomePage />,
  '/renting-home/agreement/ending': <TenancyAgreementEndingPage />,
  '/renting-home/agreement/additional-terms': <TenancyAgreementAdditionalTermsPage />,
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path={`${WILL_BASE}/*`}
          element={
            <WillStateProvider>
              <WillRoutes />
            </WillStateProvider>
          }
        />
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
