import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../api/client';
import type { Skill } from '../../api/types';
import { expectNoAxeViolations, renderAdmin } from '../../test/render';
import { SkillsPage } from './SkillsPage';

const skill = (id: number, name: string, overrides: Partial<Skill> = {}): Skill => ({ id, name, category: 'BACKEND', level: null, displayOrder: id, ...overrides });

describe('SkillsPage (config-driven CRUD)', () => {
  it('shows loading, then the rows with group labels', async () => {
    vi.spyOn(adminApi.skills, 'list').mockResolvedValue([skill(1, 'Spring Boot'), skill(2, 'Java', { category: 'LANGUAGES' })]);
    renderAdmin(<SkillsPage />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    const table = await screen.findByRole('table', { name: 'Skills' });
    expect(within(table).getByRole('cell', { name: 'Spring Boot' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: 'Languages' })).toBeInTheDocument();
  });

  it('shows an empty state, an error with retry, and never a blank screen', async () => {
    const list = vi.spyOn(adminApi.skills, 'list').mockRejectedValueOnce(new ApiError(500, 'Down')).mockResolvedValueOnce([]);
    renderAdmin(<SkillsPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('couldn’t load the skills');
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('No skills yet. Add your first one.')).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('opens an editor with focus moved into it, and validates before sending', async () => {
    vi.spyOn(adminApi.skills, 'list').mockResolvedValue([]);
    const create = vi.spyOn(adminApi.skills, 'create');
    renderAdmin(<SkillsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Add skill' }));
    expect(screen.getByRole('heading', { name: 'New skill' })).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Save skill' }));

    expect(create).not.toHaveBeenCalled();
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  });

  it('creates a skill with a correctly shaped request, confirms with a toast and refreshes the list', async () => {
    const list = vi.spyOn(adminApi.skills, 'list').mockResolvedValue([]);
    const create = vi.spyOn(adminApi.skills, 'create').mockResolvedValue(skill(9, 'Docker'));
    renderAdmin(<SkillsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Add skill' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), '  Docker ');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Group' }), 'DEVOPS');
    await userEvent.click(screen.getByRole('button', { name: 'Save skill' }));

    expect(create).toHaveBeenCalledWith({ name: 'Docker', category: 'DEVOPS', level: null, displayOrder: 0 });
    expect(await screen.findByRole('status', { name: '' })).toHaveTextContent('Skill saved.');
    expect(screen.queryByRole('heading', { name: 'New skill' })).not.toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('prefills the editor when editing and sends an update', async () => {
    vi.spyOn(adminApi.skills, 'list').mockResolvedValue([skill(4, 'Laravel', { level: 3 })]);
    const update = vi.spyOn(adminApi.skills, 'update').mockResolvedValue(skill(4, 'Laravel 11'));
    renderAdmin(<SkillsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Edit Laravel' }));
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Laravel');
    expect(screen.getByRole('spinbutton', { name: /Proficiency/ })).toHaveValue(3);

    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), ' 11');
    await userEvent.click(screen.getByRole('button', { name: 'Save skill' }));

    expect(update).toHaveBeenCalledWith(4, { name: 'Laravel 11', category: 'BACKEND', level: 3, displayOrder: 4 });
  });

  it('puts server-side field errors on the matching field', async () => {
    vi.spyOn(adminApi.skills, 'list').mockResolvedValue([]);
    vi.spyOn(adminApi.skills, 'create').mockRejectedValue(new ApiError(400, 'Validation failed', { errors: { name: 'size must be between 0 and 60' } }));
    renderAdmin(<SkillsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Add skill' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'X');
    await userEvent.click(screen.getByRole('button', { name: 'Save skill' }));

    expect(await screen.findByText('size must be between 0 and 60')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Check the highlighted fields');
  });

  it('never leaks raw 5xx details when saving fails', async () => {
    vi.spyOn(adminApi.skills, 'list').mockResolvedValue([]);
    vi.spyOn(adminApi.skills, 'create').mockRejectedValue(new ApiError(500, 'org.postgresql.util.PSQLException: boom'));
    renderAdmin(<SkillsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Add skill' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'X');
    await userEvent.click(screen.getByRole('button', { name: 'Save skill' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The server had a problem');
    expect(alert).not.toHaveTextContent('PSQLException');
  });

  it('asks for confirmation before deleting, and only deletes after Confirm', async () => {
    const list = vi.spyOn(adminApi.skills, 'list').mockResolvedValue([skill(1, 'Java')]);
    const remove = vi.spyOn(adminApi.skills, 'remove').mockResolvedValue();
    renderAdmin(<SkillsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Delete Java' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete skill?' });
    expect(dialog).toHaveTextContent('“Java” will be permanently removed');
    expect(remove).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(remove).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete Java' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(remove).toHaveBeenCalledWith(1);
    expect(await screen.findByText('Skill deleted.')).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('has no structural accessibility violations with the editor open', async () => {
    vi.spyOn(adminApi.skills, 'list').mockResolvedValue([skill(1, 'Java')]);
    const { container } = renderAdmin(<SkillsPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Add skill' }));
    await expectNoAxeViolations(container);
  });
});
