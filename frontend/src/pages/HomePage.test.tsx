import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../api/client';
import type { PageResponse, ProjectSummary } from '../api/types';
import { certifications, education, experience, profile, project } from '../test/fixtures';
import { expectNoAxeViolations, mockContentApis, renderApp } from '../test/render';
import { HomePage } from './HomePage';

// Production behaviour: no TODO_REPLACE markers, unfinished sections are simply absent.
vi.mock('../lib/env', () => ({ SHOW_PLACEHOLDERS: false }));

const page = (content: ProjectSummary[]): PageResponse<ProjectSummary> => ({ content, page: 0, size: 50, totalElements: content.length, totalPages: 1 });

function renderHome(overrides: Parameters<typeof mockContentApis>[0] = {}, projects: ProjectSummary[] = [project()]) {
  mockContentApis(overrides);
  vi.spyOn(api, 'projects').mockResolvedValue(page(projects));
  return renderApp(<HomePage />, { withContent: true });
}

describe('HomePage', () => {
  it('renders the hero from the API with the three calls to action', async () => {
    renderHome({ profile: { ...profile, cvUrl: '/api/v1/files/cv.pdf' } });

    const h1 = await screen.findByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Test Person');
    expect(screen.getByText('Intro sentence for tests.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Projects' })).toHaveAttribute('href', '#projects');
    expect(screen.getByRole('link', { name: 'Contact Me' })).toHaveAttribute('href', '#contact');
    expect(screen.getByRole('link', { name: /Download CV/ })).toHaveAttribute('href', '/api/v1/files/cv.pdf');
  });

  it('fills the hero card with the uploaded profile photo, using the alt text from the admin', async () => {
    renderHome({ profile: { ...profile, avatarUrl: '/api/v1/files/me.jpg', avatarAlt: 'Hong smiling in a white shirt' } });

    const photo = await screen.findByRole('img', { name: 'Hong smiling in a white shirt' });
    expect(photo).toHaveAttribute('src', '/api/v1/files/me.jpg');
    expect(photo.parentElement).toHaveClass('aspect-[4/5]'); // a full portrait card, not a small chip
    expect(photo).toHaveClass('object-top'); // keeps the face in frame when cropping
    expect(photo).toHaveAttribute('loading', 'eager'); // above the fold and the page's largest image
    expect(screen.queryByText(/Illustrative/)).not.toBeInTheDocument(); // the old code card is gone
  });

  it('shows a same-size monogram card (so nothing jumps later) when no photo exists', async () => {
    renderHome();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('img', { name: /Test Person/ })).not.toBeInTheDocument();
    expect(screen.getByText('TP').closest('.aspect-\\[4\\/5\\]')).not.toBeNull();
  });

  it('omits Download CV when no CV has been uploaded (no dead button in production)', async () => {
    renderHome();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('link', { name: /Download CV/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/TODO_REPLACE/)).not.toBeInTheDocument();
  });

  it('shows the skills as grouped cards, not a level list', async () => {
    renderHome();
    const skillsSection = (await screen.findByRole('heading', { level: 2, name: 'Tools I work with' })).closest('section') as HTMLElement;

    for (const label of ['Languages', 'Backend', 'Frontend', 'Databases', 'DevOps']) {
      expect(within(skillsSection).getByRole('heading', { level: 3, name: label })).toBeInTheDocument();
    }
    expect(within(skillsSection).getByText('Spring Boot')).toBeInTheDocument();
    expect(within(skillsSection).queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('leaves out sections that have no content yet', async () => {
    renderHome();
    await screen.findByRole('heading', { level: 1 });
    expect(await screen.findByRole('heading', { level: 3, name: 'Alpha' })).toBeInTheDocument();

    expect(screen.queryByRole('heading', { name: 'Background and goals' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Where I’ve worked/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Education and certifications' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Let’s talk' })).toBeInTheDocument();
  });

  it('shows experience, education and certifications once they exist', async () => {
    renderHome({ experience, education, certifications, profile: { ...profile, background: 'I studied IT.\n\nThen I built things.', careerGoals: 'Grow.', professionalSummary: 'Summary text.' } });

    expect(await screen.findByRole('heading', { name: 'Backend Intern' })).toBeInTheDocument();
    expect(screen.getByText('Jun 2025 – Present')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'B.Eng. IT' })).toBeInTheDocument();
    const credential = screen.getByRole('link', { name: /View credential/ });
    expect(credential).toHaveAttribute('target', '_blank');
    expect(credential.getAttribute('rel')).toContain('noopener');
    expect(screen.getByRole('heading', { name: 'Background and goals' })).toBeInTheDocument();
    expect(screen.getByText('Then I built things.')).toBeInTheDocument();
  });

  it('does not hide a failed section: the error is shown with a retry', async () => {
    mockContentApis();
    vi.spyOn(api, 'experience').mockRejectedValue(new ApiError(500, 'Experience service down'));
    vi.spyOn(api, 'projects').mockResolvedValue(page([project()]));
    renderApp(<HomePage />, { withContent: true });

    const alert = await screen.findByText(/couldn’t load the experience/);
    expect(alert.closest('[role="alert"]')).toHaveTextContent('Experience service down');
    expect(within(alert.closest('[role="alert"]') as HTMLElement).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('surfaces a profile failure in the hero instead of an empty page', async () => {
    mockContentApis();
    vi.spyOn(api, 'profile').mockRejectedValue(new ApiError(0, 'Network error. Check your connection and try again.'));
    vi.spyOn(api, 'projects').mockResolvedValue(page([]));
    renderApp(<HomePage />, { withContent: true });
    expect(await screen.findByText(/couldn’t load the profile/)).toBeInTheDocument();
  });

  it('renders only safe social links', async () => {
    renderHome({ profile: { ...profile, githubUrl: 'javascript:alert(1)', linkedinUrl: 'https://www.linkedin.com/in/example-test', publicEmail: 'me@example.test' } });
    const contact = (await screen.findByRole('heading', { name: 'Let’s talk' })).closest('section') as HTMLElement;

    expect(within(contact).queryByRole('link', { name: /GitHub/ })).not.toBeInTheDocument();
    const linkedin = within(contact).getByRole('link', { name: 'LinkedIn (opens in a new tab)' });
    expect(linkedin).toHaveAttribute('target', '_blank');
    expect(linkedin.getAttribute('rel')).toContain('noopener');
    expect(within(contact).getByRole('link', { name: /me@example.test/ })).toHaveAttribute('href', 'mailto:me@example.test');
  });

  it('has no structural accessibility violations with every section populated', async () => {
    const { container } = renderHome(
      {
        experience,
        education,
        certifications,
        profile: { ...profile, background: 'Background.', careerGoals: 'Goals.', professionalSummary: 'Summary.', githubUrl: 'https://github.com/example-test', cvUrl: '/api/v1/files/cv.pdf' },
      },
      [project({ featured: true }), project({ id: 2, slug: 'beta', name: 'Beta', category: 'API', githubUrl: null })],
    );
    await screen.findByRole('heading', { level: 3, name: 'Beta' });
    await screen.findByRole('heading', { name: 'Backend Intern' });

    await expectNoAxeViolations(container);
  });

  it('keeps a logical heading order: one h1, sections are h2, cards are h3', async () => {
    const { container } = renderHome({ experience, education, certifications });
    await screen.findByRole('heading', { name: 'Backend Intern' });
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    const levels = [...container.querySelectorAll('h1,h2,h3,h4')].map((h) => Number(h.tagName[1]));
    levels.forEach((level, i) => {
      if (i > 0) expect(level - (levels[i - 1] as number)).toBeLessThanOrEqual(1); // never skips a level downward
    });
  });
});
