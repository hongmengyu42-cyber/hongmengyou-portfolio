import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AdminLayout } from './AdminLayout';
import { AuthProvider, useAuth } from './AuthProvider';
import { LoginPage } from './LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EducationPage } from './pages/EducationPage';
import { ExperiencePage } from './pages/ExperiencePage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProjectEditPage } from './pages/ProjectEditPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SkillsPage } from './pages/SkillsPage';
import { NotificationProvider } from './ui/Notifications';

/** Route guard: nothing under it renders (and no admin request is made) until the session is confirmed. */
function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'checking') {
    return (
      <div role="status" aria-busy="true" className="mx-auto max-w-md p-12">
        <span className="sr-only">Checking your session…</span>
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (status === 'anonymous') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** The whole dashboard, mounted at /admin/*. It is lazy-loaded, so visitors to the public site never download it. */
export function AdminApp() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/new" element={<ProjectEditPage />} />
              <Route path="projects/:id" element={<ProjectEditPage />} />
              <Route path="skills" element={<SkillsPage />} />
              <Route path="experience" element={<ExperiencePage />} />
              <Route path="education" element={<EducationPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="*" element={<NotFoundPage what="admin page" />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default AdminApp;
