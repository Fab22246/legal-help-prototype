import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { HomePage } from '../pages/HomePage'
import { PlaceholderPage } from '../components/PlaceholderPage'
import { routes } from '../data/routes'

// All routes render inside AppLayout. Every topic route is a placeholder for now,
// driven by the route registry so pages can be swapped in later per route.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={<PlaceholderPage meta={route} />} />
        ))}
        <Route path="*" element={<PlaceholderPage notFound />} />
      </Route>
    </Routes>
  )
}
