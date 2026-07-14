import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
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
import PrivacyPolicy from './pages/PrivacyPolicy'
import TotalPlays from './pages/TotalPlays'
import ReflectionModeration from './pages/ReflectionModeration'
import ReflectionWall from './pages/ReflectionWall'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import RhythmHub from './pages/RhythmHub'
import RhythmResults from './pages/RhythmResults'
import Settings from './pages/Settings'
import SongExperience from './pages/SongExperience'
import SongsLibrary from './pages/SongsLibrary'
import Studio from './pages/Studio'
import TriviaHub from './pages/TriviaHub'
import TermsAndConditions from './pages/TermsAndConditions'
import './App.css'
import './Profile.css'
import CreatorGenerationJobs from './pages/CreatorGenerationJobs'
import VideoEditor from './pages/VideoEditor'
function MainExperience() {
  const { user } = useAuth()

  return <MainLayout role={user ? 'user' : 'guest'} />
}

function AuthExperience() {
  const { user } = useAuth()

  if (user?.role === 'CREATOR') {
    return <Navigate replace to="/creator/dashboard" />
  }

  if (user) {
    return <Navigate replace to="/" />
  }

  return <AuthLayout />
}

function App() {
  const { token, user } = useAuth()
  const isCreator = Boolean(token && user?.role === 'CREATOR')
  const isRegistered = Boolean(token && user?.role === 'REGISTERED')

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
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
          <Route element={<ReflectionWall />} path="/reflections" />
          <Route element={<ProtectedRoute isAllowed={isRegistered}><Profile /></ProtectedRoute>} path="/profile" />
          <Route element={<Settings />} path="/settings" />
          <Route element={<PrivacyPolicy />} path="/privacy" />
          <Route element={<TermsAndConditions />} path="/terms" />
        </Route>

        <Route element={<AuthExperience />}>
          <Route element={<Login />} path="/login" />
          <Route element={<Register />} path="/register" />
          <Route element={<ForgotPassword />} path="/forgot-password" />
          <Route element={<ResetPassword />} path="/reset-password" />
        </Route>

        <Route element={<ProtectedRoute isAllowed={isCreator} />}>
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
            <Route element={<TotalPlays />} path="/creator/plays" />
            <Route element={<ReflectionModeration />} path="/creator/reflections" />
            <Route element={<Profile />} path="/creator/profile" />
            <Route element={<Settings />} path="/creator/settings" />
          </Route>
        </Route>

        <Route element={<RhythmGame />} path="/game/:songId" />
        <Route element={<RhythmResults />} path="/game/:songId/results" />
        <Route element={<NotFound />} path="*" />
      </Routes>
    </BrowserRouter>
  )
}

export default App
