import { Route, Routes } from 'react-router-dom'
import { willPaths } from '../../state/will/willPaths'
import { WillStartPage, SuitabilityIntroPage } from './contentPages'
import { WillStepPage } from './WillStepPage'
import { WillChangePage } from './WillChangePage'
import { CheckYourAnswersPage } from './CheckYourAnswersPage'
import { ClearConfirmationPage } from './ClearConfirmationPage'
import { RouteAResultPage } from './RouteAResultPage'
import { RouteASigningPage } from './RouteASigningPage'
import { RouteASafekeepingPage } from './RouteASafekeepingPage'
import { RouteBResultPage } from './RouteBResultPage'
import { RouteCResultPage } from './RouteCResultPage'

// Complete internal route tree for the will journey. Not mounted by the running
// application.
export function WillRoutes() {
  return (
    <Routes>
      <Route path={willPaths.start} element={<WillStartPage />} />
      <Route path={willPaths.suitabilityIntro} element={<SuitabilityIntroPage />} />
      <Route path={willPaths.stepPattern} element={<WillStepPage />} />
      <Route path={willPaths.change} element={<WillChangePage />} />
      <Route path={willPaths.checkYourAnswers} element={<CheckYourAnswersPage />} />
      <Route path={willPaths.clearConfirm} element={<ClearConfirmationPage />} />
      <Route path={willPaths.resultA} element={<RouteAResultPage />} />
      <Route path={willPaths.signing} element={<RouteASigningPage />} />
      <Route path={willPaths.safekeeping} element={<RouteASafekeepingPage />} />
      <Route path={willPaths.resultB} element={<RouteBResultPage />} />
      <Route path={willPaths.resultC} element={<RouteCResultPage />} />
    </Routes>
  )
}
