import { HashRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'

// HashRouter keeps the prototype working on any static host (including GitHub
// Pages) without server-side route rewrites. Client-side routing only.
export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}
