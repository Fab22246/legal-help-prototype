import { Routes, Route } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { HomePage } from '../pages/HomePage'
import { PlaceholderPage } from '../components/PlaceholderPage'
import { SigningWitnessingCertifiedCopiesPage } from '../pages/SigningWitnessingCertifiedCopiesPage'
import { ChangeNameRecordPage } from '../pages/ChangeNameRecordPage'
import { RentingHomePage } from '../pages/RentingHomePage'
import { routes } from '../data/routes'

// Built routes render their own page; every other route still renders the
// registry-driven placeholder. Added one route at a time in later phases.
const BUILT_ROUTES: Record<string, ReactNode> = {
  '/signing-witnessing-certified-copies': <SigningWitnessingCertifiedCopiesPage />,
  '/change-name-record': <ChangeNameRecordPage />,
  '/renting-home': <RentingHomePage />,
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
