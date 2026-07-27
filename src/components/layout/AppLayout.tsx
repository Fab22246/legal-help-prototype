import { Outlet } from 'react-router-dom'
import { SkipLink } from '../navigation/SkipLink'
import { Header } from './Header'
import { StatusBanner } from './StatusBanner'
import { Footer } from './Footer'

export function AppLayout() {
  return (
    <>
      <SkipLink />
      <Header />
      <StatusBanner />
      <main id="main-content" className="app-main" tabIndex={-1}>
        <div className="app-container">
          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  )
}
