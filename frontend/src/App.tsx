import '@fontsource-variable/inter';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserLayout } from './layouts/UserLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DashboardPage } from './pages/user/DashboardPage';
import { ReviewPage } from './pages/user/ReviewPage';
import { SchedulePage } from './pages/user/SchedulePage';
import { AskPage } from './pages/user/AskPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { KnowledgePage } from './pages/admin/KnowledgePage';
import { FlashcardsPage } from './pages/admin/FlashcardsPage';
import { TasksPage } from './pages/admin/TasksPage';
import { AgentPage } from './pages/admin/AgentPage';
import { SettingsPage } from './pages/admin/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="ask" element={<AskPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="agent" element={<AgentPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
