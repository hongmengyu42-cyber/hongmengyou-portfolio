import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { project } from '../../test/fixtures';
import { renderApp } from '../../test/render';
import { ProjectCard } from './ProjectCard';

describe('ProjectCard', () => {
  it('renders a Live Demo link that opens in a new tab and protects the opener', () => {
    renderApp(<ProjectCard project={project()} />);

    const live = screen.getByRole('link', { name: /Live Demo of Alpha/i });
    expect(live).toHaveAttribute('href', 'https://alpha.example.test/demo');
    expect(live).toHaveAttribute('target', '_blank');
    expect(live.getAttribute('rel')).toContain('noopener');
    expect(live.getAttribute('rel')).toContain('noreferrer');
  });

  it('shows Source Code only when a repository URL exists', () => {
    const { unmount } = renderApp(<ProjectCard project={project()} />);
    const source = screen.getByRole('link', { name: /Source Code of Alpha/i });
    expect(source).toHaveAttribute('href', 'https://github.com/example-test/alpha');
    expect(source).toHaveAttribute('target', '_blank');
    unmount();

    renderApp(<ProjectCard project={project({ githubUrl: null })} />);
    expect(screen.queryByRole('link', { name: /Source Code/i })).not.toBeInTheDocument();
  });

  it.each(['javascript:alert(1)', 'data:text/html,hi', 'ftp://example.test'])('never links a non-http(s) URL (%s)', (url) => {
    renderApp(<ProjectCard project={project({ liveUrl: url, githubUrl: url })} />);
    expect(screen.queryByRole('link', { name: /Live Demo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Source Code/i })).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
  });

  it('renders a lazy-loaded screenshot with alt text and intrinsic size to avoid layout shift', () => {
    renderApp(
      <ProjectCard
        project={project({ thumbnail: { id: 1, url: '/api/v1/files/x.png', altText: 'Alpha dashboard', thumbnail: true, sortOrder: 0, width: 1600, height: 1000 } })}
      />,
    );
    // Role queries cannot see it: the screenshot link is a mouse-only duplicate of the title link and is
    // aria-hidden on purpose, so keyboard and screen-reader users meet one link per project, not two.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const image = screen.getByAltText('Alpha dashboard');
    expect(image.closest('a')).toHaveAttribute('aria-hidden', 'true');
    expect(image.closest('a')).toHaveAttribute('tabindex', '-1');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('width', '1600');
    expect(image).toHaveAttribute('height', '1000');
  });

  it('falls back to a decorative placeholder when there is no screenshot', () => {
    renderApp(<ProjectCard project={project({ thumbnail: null })} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('links the title to the detail page, shows status, category and technologies', () => {
    renderApp(<ProjectCard project={project({ status: 'IN_DEVELOPMENT', category: 'API' })} large />);
    expect(screen.getByRole('heading', { level: 3, name: 'Alpha' })).toBeInTheDocument();
    expect(within(screen.getByRole('heading', { level: 3 })).getByRole('link')).toHaveAttribute('href', '/projects/alpha');
    expect(screen.getByRole('link', { name: 'View details of Alpha' })).toHaveAttribute('href', '/projects/alpha');
    expect(screen.getByText('In development')).toBeInTheDocument();
    expect(screen.getByText('API')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Technologies' })).getAllByRole('listitem')).toHaveLength(2);
  });
});
