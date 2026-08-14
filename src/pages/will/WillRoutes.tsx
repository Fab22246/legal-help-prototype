import { Route, Routes } from 'react-router-dom'
import { willPaths, willRoutePath } from '../../state/will/willPaths'
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

// Route tree for the will journey, mounted as a descendant route subtree under
// WILL_BASE. Paths are relative to that base.
export function WillRoutes() {
  return (
    <Routes>
      <Route path={willRoutePath(willPaths.start)} element={<WillStartPage />} />
      <Route path={willRoutePath(willPaths.suitabilityIntro)} element={<SuitabilityIntroPage />} />
      <Route path={willRoutePath(willPaths.stepPattern)} element={<WillStepPage />} />
      <Route path={willRoutePath(willPaths.change)} element={<WillChangePage />} />
      <Route path={willRoutePath(willPaths.checkYourAnswers)} element={<CheckYourAnswersPage />} />
      <Route path={willRoutePath(willPaths.clearConfirm)} element={<ClearConfirmationPage />} />
      <Route path={willRoutePath(willPaths.resultA)} element={<RouteAResultPage />} />
      <Route path={willRoutePath(willPaths.signing)} element={<RouteASigningPage />} />
      <Route path={willRoutePath(willPaths.safekeeping)} element={<RouteASafekeepingPage />} />
      <Route path={willRoutePath(willPaths.resultB)} element={<RouteBResultPage />} />
      <Route path={willRoutePath(willPaths.resultC)} element={<RouteCResultPage />} />
    </Routes>
  )
}
