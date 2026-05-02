import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav.jsx'
import { OfflineToast } from '../components/OfflineToast.jsx'
import { OnboardingOverlay } from '../pages/OnboardingOverlay.jsx'

const HomePage             = lazy(() => import('../pages/HomePage.jsx'))
const StudyPage            = lazy(() => import('../pages/StudyPage.jsx'))
const BrowsePage           = lazy(() => import('../pages/BrowsePage.jsx'))
const BrowseCategoryPage   = lazy(() => import('../pages/BrowseCategoryPage.jsx'))
const QuestionSheet        = lazy(() => import('../pages/QuestionSheet.jsx'))
const StatsPage            = lazy(() => import('../pages/StatsPage.jsx'))
const SettingsPage         = lazy(() => import('../pages/SettingsPage.jsx'))

const HIDE_NAV_PATTERNS = [/^\/study(\/|$)/, /^\/browse\/question\//]

export default function App() {
  const { pathname } = useLocation()
  const hideNav = HIDE_NAV_PATTERNS.some(re => re.test(pathname))
  return (
    <>
      <OfflineToast />
      <OnboardingOverlay />
      <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/study/:categorySlug" element={<StudyPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/browse/category/:slug" element={<BrowseCategoryPage />} />
          <Route path="/browse/question/:id" element={<><BrowsePage /><QuestionSheet /></>} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
      {!hideNav && <BottomNav />}
    </>
  )
}
