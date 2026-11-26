import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Skeleton } from './components/ui/Skeleton';
import { HomePage } from './pages/HomePage';

// Code splitting: the detail page (and later the admin area) is downloaded only when visited.
const ProjectPage = lazy(() => import('./pages/ProjectPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminApp = lazy(() => import('./admin/AdminApp'));

const fallback = (
  <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8" role="status" aria-busy="true">
    <span className="sr-only">Loading page…</span>
    <Skeleton className="h-64" />
  </div>
);

export function App() {
  return (
    <Suspense fallback={fallback}>
      <Routes>
        <Route path="admin/*" element={<AdminApp />} />
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="projects/:slug" element={<ProjectPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
