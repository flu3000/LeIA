import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ChatPage from './pages/ChatPage'
import TopicsPage from './pages/TopicsPage'
import LibraryPage from './pages/LibraryPage'
import PomodoroPage from './pages/PomodoroPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import TopicDetailPage from './pages/TopicDetailPage'
import SocialPage from './pages/SocialPage'
import RankingsPage from './pages/RankingsPage'
import InsightsPage from './pages/InsightsPage'
import SettingsPage from './pages/SettingsPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import CommunitiesPage from './pages/CommunitiesPage'
import UserProfilePage from './pages/UserProfilePage'
import BookDetailPage from './pages/BookDetailPage'
import { useAuth } from './context/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-secondary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ChatPage />} />
          <Route path="topics" element={<TopicsPage />} />
          <Route path="topics/:id" element={<TopicDetailPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="pomodoro" element={<PomodoroPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="social" element={<SocialPage />} />
          <Route path="rankings" element={<RankingsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="communities" element={<CommunitiesPage />} />
          <Route path="profile/:handle" element={<UserProfilePage />} />
          <Route path="books/:id" element={<BookDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
