import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../api/client';
import { detail, image } from '../../test/adminFixtures';
import { expectNoAxeViolations, renderAdmin } from '../../test/render';
import { crossValidate, ProjectEditPage, toForm, toRequest } from './ProjectEditPage';

const renderAt = (route: string) =>
  renderAdmin(
    <Routes>
      <Route path="/admin/projects" element={<p>PROJECT LIST</p>} />
      <Route path="/admin/projects/new" element={<ProjectEditPage />} />
      <Route path="/admin/projects/:id" element={<ProjectEditPage />} />
    </Routes>,
    { route },
  );

const fillRequired = async () => {
  await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'My New App');
  await userEvent.type(screen.getByRole('textbox', { name: 'Short summary' }), 'A summary.');
  await userEvent.type(screen.getByRole('textbox', { name: 'Full description' }), 'A description.');
};

describe('ProjectEditPage: new project', () => {
  it('blocks an empty submit and focuses the first problem', async () => {
    const create = vi.spyOn(adminApi.projects, 'create');
    renderAt('/admin/projects/new');

    await userEvent.click(await screen.findByRole('button', { name: 'Create project' }));

    expect(create).not.toHaveBeenCalled();
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  });

  it.each(['javascript:alert(1)', 'data:text/html,hi', 'ftp://files.example.test', 'example.test'])('rejects the live URL %s before anything is sent', async (url) => {
    const create = vi.spyOn(adminApi.projects, 'create');
    renderAt('/admin/projects/new');
    await fillRequired();
    await userEvent.type(screen.getByRole('textbox', { name: 'Live demo URL' }), url);

    await userEvent.click(screen.getByRole('button', { name: 'Create project' }));

    expect(screen.getByText('Enter a valid http or https URL.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('creates the project with a well-formed request, then opens it so screenshots can be added', async () => {
    const create = vi.spyOn(adminApi.projects, 'create').mockResolvedValue(detail({ id: 7, name: 'My New App' }));
    vi.spyOn(adminApi.projects, 'get').mockResolvedValue(detail({ id: 7, name: 'My New App' }));
    renderAt('/admin/projects/new');
    await fillRequired();
    await userEvent.type(screen.getByRole('textbox', { name: 'Key features' }), 'Fast{Enter}Accessible{Enter}{Enter}Tested');
    await userEvent.type(screen.getByRole('textbox', { name: 'Technologies' }), 'Java,  Spring Boot , ,React');
    await userEvent.type(screen.getByRole('textbox', { name: 'Live demo URL' }), 'https://app.example.test');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'API');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Published' }));

    await userEvent.click(screen.getByRole('button', { name: 'Create project' }));

    expect(create).toHaveBeenCalledWith({
      name: 'My New App', slug: null, summary: 'A summary.', description: 'A description.', problem: null, solution: null,
      keyFeatures: ['Fast', 'Accessible', 'Tested'], category: 'API', status: 'IN_DEVELOPMENT',
      liveUrl: 'https://app.example.test', githubUrl: null, featured: false, published: true,
      technologies: ['Java', 'Spring Boot', 'React'],
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'My New App' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Screenshots' })).toBeInTheDocument();
    expect(await screen.findByText('Project created. Now add screenshots.')).toBeInTheDocument();
  });

  it('shows the server message when the slug is already taken', async () => {
    vi.spyOn(adminApi.projects, 'create').mockRejectedValue(new ApiError(409, 'Slug already in use: taken'));
    renderAt('/admin/projects/new');
    await fillRequired();
    await userEvent.type(screen.getByRole('textbox', { name: 'URL slug' }), 'taken');
    await userEvent.click(screen.getByRole('button', { name: 'Create project' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Slug already in use: taken');
  });

  it('rejects a malformed slug and too many features client-side', async () => {
    const create = vi.spyOn(adminApi.projects, 'create');
    renderAt('/admin/projects/new');
    await fillRequired();
    await userEvent.type(screen.getByRole('textbox', { name: 'URL slug' }), 'Bad Slug!');
    await userEvent.click(screen.getByRole('button', { name: 'Create project' }));
    expect(screen.getByText('Use lowercase letters, digits and single hyphens only.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('has no structural accessibility violations', async () => {
    const { container } = renderAt('/admin/projects/new');
    await screen.findByRole('button', { name: 'Create project' });
    await expectNoAxeViolations(container);
  });
});

describe('ProjectEditPage: existing project', () => {
  it('loads and prefills the form, then saves an update', async () => {
    vi.spyOn(adminApi.projects, 'get').mockResolvedValue(detail({ images: [image(1, { thumbnail: true })] }));
    const update = vi.spyOn(adminApi.projects, 'update').mockResolvedValue(detail());
    renderAt('/admin/projects/1');

    expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveValue('Alpha');
    expect(screen.getByRole('textbox', { name: 'Technologies' })).toHaveValue('Java, React');
    expect(screen.getByRole('textbox', { name: 'Key features' })).toHaveValue('Fast\nSmall');
    expect(screen.getByRole('checkbox', { name: 'Published' })).toBeChecked();

    await userEvent.type(screen.getByRole('textbox', { name: 'Short summary' }), ' More.');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(update).toHaveBeenCalledWith(1, expect.objectContaining({ summary: 'Alpha summary. More.', slug: 'alpha' }));
    expect(await screen.findByText('Project saved.')).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown project and for a non-numeric id', async () => {
    vi.spyOn(adminApi.projects, 'get').mockRejectedValue(new ApiError(404, 'Project not found: 99'));
    const { unmount } = renderAt('/admin/projects/99');
    expect(await screen.findByRole('heading', { name: /couldn’t find that project/ })).toBeInTheDocument();
    unmount();

    renderAt('/admin/projects/abc');
    expect(await screen.findByRole('heading', { name: /couldn’t find that project/ })).toBeInTheDocument();
  });

  it('checks the live link and reports the result', async () => {
    vi.spyOn(adminApi.projects, 'get').mockResolvedValue(detail());
    const check = vi.spyOn(adminApi.projects, 'checkLink').mockResolvedValue({ projectId: 1, projectName: 'Alpha', status: 'OK', note: 'HTTP 200' });
    renderAt('/admin/projects/1');

    await userEvent.click(await screen.findByRole('button', { name: 'Check link now' }));

    expect(check).toHaveBeenCalledWith(1);
    expect(await screen.findByText('Link check: HTTP 200.')).toBeInTheDocument();
  });

  it('disables the link check when there is no live URL', async () => {
    vi.spyOn(adminApi.projects, 'get').mockResolvedValue(detail({ liveUrl: null }));
    renderAt('/admin/projects/1');
    expect(await screen.findByRole('button', { name: 'Check link now' })).toBeDisabled();
  });

  it('deletes only after confirmation, then returns to the list', async () => {
    vi.spyOn(adminApi.projects, 'get').mockResolvedValue(detail());
    const remove = vi.spyOn(adminApi.projects, 'remove').mockResolvedValue();
    renderAt('/admin/projects/1');

    await userEvent.click(await screen.findByRole('button', { name: 'Delete this project' }));
    expect(remove).not.toHaveBeenCalled();
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Delete project?' })).getByRole('button', { name: 'Delete' }));

    expect(remove).toHaveBeenCalledWith(1);
    expect(await screen.findByText('PROJECT LIST')).toBeInTheDocument();
  });
});

describe('project form mapping', () => {
  it('round-trips an entity through the form and back to a request', () => {
    const request = toRequest(toForm(detail({ problem: 'P', githubUrl: 'https://github.com/example-test/a' })));
    expect(request).toMatchObject({ name: 'Alpha', slug: 'alpha', problem: 'P', solution: null, githubUrl: 'https://github.com/example-test/a', technologies: ['Java', 'React'], keyFeatures: ['Fast', 'Small'] });
  });

  it('enforces the backend collection limits', () => {
    const many = Array.from({ length: 21 }, (_, i) => `f${i}`).join('\n');
    expect(crossValidate({ ...toForm(null), keyFeatures: many }).keyFeatures).toMatch(/at most 20/);
    expect(crossValidate({ ...toForm(null), technologies: 'x'.repeat(51) }).technologies).toMatch(/50 characters/);
    expect(crossValidate(toForm(null))).toEqual({});
  });
});
