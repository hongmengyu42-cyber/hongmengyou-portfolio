import { Outlet } from 'react-router-dom';
import { ContentProvider } from '../../content/ContentProvider';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { Footer } from './Footer';
import { Header } from './Header';
import { ScrollManager } from './ScrollManager';
import { SkipLink } from './SkipLink';

export function Layout() {
  return (
    <ContentProvider>
      <SkipLink />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <ScrollManager />
    </ContentProvider>
  );
}
