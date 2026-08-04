import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import CreatorRoute from './components/CreatorRoute'
import RhythmGame from './components/RhythmGame'
import ScrollToTop from './components/ScrollToTop'
import { useAuth } from './context/AuthContext'
import AuthLayout from './layouts/AuthLayout'
import CreatorLayout from './layouts/CreatorLayout'
import MainLayout from './layouts/MainLayout'
import CreatorSongs from './pages/CreatorSongs'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import GenerationProgress from './pages/GenerationProgress'
import GuidedMusicLessons from './pages/GuidedMusicLessons'
import HeritageVault from './pages/HeritageVault'
import InstrumentDiscoveryLab from './pages/InstrumentDiscoveryLab'
import InstrumentPlayground from './pages/InstrumentPlayground'
import Landing from './pages/Landing'
import LearningHub from './pages/LearningHub'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import PublicCreatorProfile from './pages/PublicCreatorProfile'
import PublicUserProfile from './pages/PublicUserProfile'
import CreatorProfile from './components/profile/CreatorProfile'
import CreatorProfileSettings from './pages/CreatorProfileSettings'
import PrivacyPolicy from './pages/PrivacyPolicy'
import ReflectionModeration from './pages/ReflectionModeration'
import ReflectionWall from './pages/ReflectionWall'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import OtpVerification from './pages/OtpVerification'
import RegistrationSuccess from './pages/RegistrationSuccess'
import RhythmHub from './pages/RhythmHub'
import RhythmResults from './pages/RhythmResults'
import RhythmScoreClaim from './pages/RhythmScoreClaim'
import Settings from './pages/Settings'
import SongExperience from './pages/SongExperience'
import SongsLibrary from './pages/SongsLibrary'
import Studio from './pages/Studio'
import TriviaHub from './pages/TriviaHub'
import TermsAndConditions from './pages/TermsAndConditions'
import './App.css'
import './SongsLibrary.css'
import './Profile.css'
import CreatorGenerationJobs from './pages/CreatorGenerationJobs'
import VideoEditor from './pages/VideoEditor'
import CreatorApplication from './pages/CreatorApplication'
import CreatorFolders from './pages/CreatorFolders'
import CreatorAnalytics from './pages/CreatorAnalytics'
import AdminLayout from './layouts/AdminLayout'
import AdminActivityPage from './pages/AdminActivityPage'
import AdminCommunityPage from './pages/AdminCommunityPage'
import AdminContentPage from './pages/AdminContentPage'
import AdminCreatorsPage from './pages/AdminCreatorsPage'
import AdminOverview from './pages/AdminOverview'
import { hasActiveAccount, hasActiveCreatorAccess } from './utils/accessStatus'
import AccountAccessSuspended from './components/AccountAccessSuspended'
import RhythmLeaderboard from './pages/RhythmLeaderboard'
import { readPendingScoreClaim } from './services/pendingScoreClaim'
import { isNewAccountScoreClaim, readRegistrationReturn, RHYTHM_SCORE_CLAIM_PATH } from './services/safeReturnPath'
function MainExperience() {
  const { user } = useAuth()

  return <MainLayout role={user && hasActiveAccount(user) ? 'user' : 'guest'} />
}

function ResetPasswordFromSettings() {
  const { signOut } = useAuth()
  return <ResetPassword afterCompletePath="/login" onComplete={signOut} requestPath="/settings/security/password/request" />
}

function AuthExperience() {
  const { activeMode, user } = useAuth()

  if (user && !hasActiveAccount(user)) return <AccountAccessSuspended />

  if (user && readRegistrationReturn() === RHYTHM_SCORE_CLAIM_PATH && (readPendingScoreClaim() || isNewAccountScoreClaim())) {
    return <Navigate replace to={RHYTHM_SCORE_CLAIM_PATH} />
  }

  if (hasActiveCreatorAccess(user) && activeMode === 'creator') {
    return <Navigate replace to="/creator/dashboard" />
  }

  if (user?.role === 'CREATOR' && hasActiveAccount(user)) return <Navigate replace to="/" />

  if (user?.role === 'ADMIN') {
    return <Navigate replace to="/admin" />
  }

  if (user) {
    return <Navigate replace to="/" />
  }

  return <AuthLayout />
}

function App() {
  const { authLoading, token, user } = useAuth()
  const isNormalUser = Boolean(token && ['CREATOR', 'REGISTERED'].includes(user?.role) && hasActiveAccount(user))
  const isRegistered = Boolean(token && user?.role === 'REGISTERED' && hasActiveAccount(user))
  const isAdmin = Boolean(token && user?.role === 'ADMIN' && hasActiveAccount(user))

  return (
    <BrowserRouter>
      <ScrollToTop />
      {token && user && !hasActiveAccount(user) ? <AccountAccessSuspended /> : <Routes>
        <Route element={<MainExperience />}>
          <Route element={<Landing />} path="/" />
          <Route element={<SongsLibrary />} path="/songs" />
          <Route element={<SongExperience />} path="/songs/:id" />
          <Route element={<TriviaHub />} path="/songs/:id/trivia" />
          <Route element={<InstrumentPlayground />} path="/songs/:id/playground" />
          <Route element={<LearningHub />} path="/learning" />
          <Route element={<HeritageVault />} path="/learning/heritage-vault" />
          <Route element={<InstrumentDiscoveryLab />} path="/learning/instrument-lab" />
          <Route element={<GuidedMusicLessons />} path="/learning/guided-lessons" />
          <Route element={<RhythmHub />} path="/rhythm-game" />
          <Route element={<RhythmLeaderboard />} path="/rhythm-game/leaderboard" />
          <Route element={<RhythmResults />} path="/game/:songId/results" />
          <Route element={<ProtectedRoute isAllowed={isNormalUser} isLoading={authLoading} loadingFallback={<div className="results-page"><section className="results-card rhythm-claim-card"><p aria-live="polite" role="status">Restoring your account&hellip;</p></section></div>}><RhythmScoreClaim /></ProtectedRoute>} path="/rhythm-game/claim" />
          <Route element={<ReflectionWall />} path="/reflections" />
          <Route element={<PublicCreatorProfile />} path="/creators/:creatorId" />
          <Route element={<PublicUserProfile />} path="/users/:userId" />
          <Route element={<ProtectedRoute isAllowed={isNormalUser}><Profile /></ProtectedRoute>} path="/profile" />
          <Route element={<ProtectedRoute isAllowed={isRegistered}><CreatorApplication /></ProtectedRoute>} path="/apply/creator" />
          <Route element={<ProtectedRoute isAllowed={isNormalUser}><Settings /></ProtectedRoute>} path="/settings" />
          <Route element={<ProtectedRoute isAllowed={isNormalUser}><Settings section="profile" /></ProtectedRoute>} path="/settings/profile" />
          <Route element={<ProtectedRoute isAllowed={isNormalUser}><Settings section="account-security" /></ProtectedRoute>} path="/settings/account-security" />
          <Route element={<ProtectedRoute isAllowed={isNormalUser}><Settings section="data-privacy" /></ProtectedRoute>} path="/settings/data-privacy" />
          <Route element={<ProtectedRoute isAllowed={isNormalUser}><ForgotPassword backLabel="Back to settings" backPath="/settings/account-security" nextPath="/settings/security/password/verify" /></ProtectedRoute>} path="/settings/security/password/request" />
          <Route element={<ProtectedRoute isAllowed={isNormalUser}><ResetPasswordFromSettings /></ProtectedRoute>} path="/settings/security/password/verify" />
          <Route element={<PrivacyPolicy />} path="/privacy" />
          <Route element={<TermsAndConditions />} path="/terms" />
        </Route>

        <Route element={<AuthExperience />}>
          <Route element={<Login />} path="/login" />
          <Route element={<Register />} path="/register" />
          <Route element={<ForgotPassword />} path="/forgot-password" />
          <Route element={<ResetPassword />} path="/reset-password" />
          <Route element={<OtpVerification />} path="/verify-email" />
        </Route>

        <Route element={<AuthLayout />}>
          <Route element={<RegistrationSuccess />} path="/registration-success" />
        </Route>

        <Route element={<CreatorRoute />}>
          <Route element={<CreatorLayout />}>
            <Route element={<Navigate replace to="/creator/dashboard" />} path="/creator" />
            <Route element={<Dashboard />} path="/creator/dashboard" />
            <Route element={<Navigate replace to="/creator/studio/new" />} path="/creator/studio" />
            <Route element={<Studio />} path="/creator/studio/new" />
            <Route element={<Studio />} path="/creator/studio/:songId" />
            <Route element={<CreatorSongs />} path="/creator/songs" />
            <Route element={<CreatorGenerationJobs />} path="/creator/generation" />
            <Route element={<GenerationProgress />} path="/creator/generation/:id" />
            <Route element={<VideoEditor />} path="/creator/editor/:id" />
            <Route element={<Navigate replace to="/creator/analytics" />} path="/creator/plays" />
            <Route element={<ReflectionModeration />} path="/creator/reflections" />
            <Route element={<CreatorFolders />} path="/creator/folders" />
            <Route element={<CreatorAnalytics />} path="/creator/analytics" />
            <Route element={<CreatorProfile />} path="/creator/profile" />
            <Route element={<CreatorProfileSettings />} path="/creator/profile/edit" />
            <Route element={<Navigate replace to="/settings/profile" />} path="/creator/settings" />
          </Route>
        </Route>

        <Route element={<ProtectedRoute isAllowed={isAdmin} />}>
          <Route element={<AdminLayout />}>
            <Route element={<AdminOverview />} path="/admin" />
            <Route element={<AdminCreatorsPage />} path="/admin/creators" />
            <Route element={<AdminContentPage />} path="/admin/content" />
            <Route element={<AdminCommunityPage />} path="/admin/community" />
            <Route element={<AdminActivityPage />} path="/admin/activity" />
            <Route element={<Navigate replace to="/admin/creators?tab=applications" />} path="/admin/applications" />
            <Route element={<Navigate replace to="/admin/content?tab=songs" />} path="/admin/songs" />
            <Route element={<Navigate replace to="/admin/community?tab=reports" />} path="/admin/reflections" />
            <Route element={<Navigate replace to="/admin/content?tab=collections" />} path="/admin/folders" />
            <Route element={<Navigate replace to="/admin/activity" />} path="/admin/governance" />
          </Route>
        </Route>

        <Route element={<RhythmGame />} path="/game/:songId" />
        <Route element={<NotFound />} path="*" />
      </Routes>}
    </BrowserRouter>
  )
}

export default App
