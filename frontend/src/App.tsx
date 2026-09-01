import '@fontsource-variable/inter';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserLayout } from './layouts/UserLayout';
import { AdminLayout } from './layouts/AdminLayout';
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
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route path="/app" element={<UserLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="ask" element={<AskPage />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="flashcards" element={<FlashcardsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default App;
