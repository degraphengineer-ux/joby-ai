import { Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../features/landing/LandingPage'
import { AuthPage } from '../features/auth/AuthPages'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { PublicOnlyRoute } from '../features/auth/PublicOnlyRoute'
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout'
import { OnboardingPage } from '../features/profile/OnboardingPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { SkillsPage } from '../features/skills/SkillsPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { AssessmentDetailPage } from '../features/assessments/AssessmentDetailPage'
import { AssessmentResultsPage } from '../features/assessments/AssessmentResultsPage'
import { AssessmentsPage } from '../features/assessments/AssessmentsPage'
import { EvidencePage } from '../features/evidence/EvidencePage'
import { EvidenceDetailPage } from '../features/evidence/EvidenceDetailPage'
import { SkillExtractionPage } from '../features/extraction/SkillExtractionPage'
import { PassportPage } from '../features/passport/PassportPage'
import { PublicPassportPage } from '../features/passport/PublicPassportPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { ReviewerDashboardPage } from '../features/reviewer/ReviewerDashboardPage'
import { ImpactDashboardPage } from '../features/impact/ImpactDashboardPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/p/:slug" element={<PublicPassportPage />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <AuthPage mode="login" />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <AuthPage mode="signup" />
          </PublicOnlyRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/evidence" element={<EvidencePage />} />
        <Route path="/evidence/analyze" element={<SkillExtractionPage />} />
        <Route path="/evidence/:evidenceId" element={<EvidenceDetailPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/assessments/results/:attemptId" element={<AssessmentResultsPage />} />
        <Route path="/assessments/:assessmentId" element={<AssessmentDetailPage />} />
        <Route path="/passport" element={<PassportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reviewer" element={<ReviewerDashboardPage />} />
        <Route path="/impact" element={<ImpactDashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
