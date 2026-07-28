import { HashRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'
import { TenancyBuilderProvider } from './state/TenancyBuilder'

// HashRouter keeps the prototype working on any static host (including GitHub
// Pages) without server-side route rewrites. Client-side routing only.
//
// TenancyBuilderProvider wraps the whole app so the tenancy-builder routes
// share one in-memory state cache (backed by sessionStorage) across route
// changes. Only the /renting-home/agreement/* routes call useTenancyBuilder.
export function App() {
  return (
    <HashRouter>
      <TenancyBuilderProvider>
        <AppRoutes />
      </TenancyBuilderProvider>
    </HashRouter>
  )
}
