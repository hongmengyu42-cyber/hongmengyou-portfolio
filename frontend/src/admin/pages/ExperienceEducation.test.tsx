import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi } from '../../api/admin';
import { renderAdmin } from '../../test/render';
import { EducationPage } from './EducationPage';
import { ExperiencePage } from './ExperiencePage';

describe('ExperiencePage', () => {
  it('rejects an end date before the start date and maps optional fields to null on save', async () => {
    vi.spyOn(adminApi.experience, 'list').mockResolvedValue([]);
    const create = vi.spyOn(adminApi.experience, 'create').mockResolvedValue({} as never);
    renderAdmin(<ExperiencePage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Add experience' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Role' }), 'Backend Intern');
    await userEvent.type(screen.getByRole('textbox', { name: 'Company or organisation' }), 'Example Co');
    fireEvent.change(screen.getByLabelText(/Start date/), { target: { value: '2025-06-01' } });
    fireEvent.change(screen.getByLabelText(/End date/), { target: { value: '2025-05-01' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save experience' }));

    expect(screen.getByText('End date must not be before the start date.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/End date/), { target: { value: '' } }); // current role
    await userEvent.click(screen.getByRole('button', { name: 'Save experience' }));

    expect(create).toHaveBeenCalledWith({
      role: 'Backend Intern', company: 'Example Co', location: null, type: 'WORK',
      startDate: '2025-06-01', endDate: null, description: '',
    });
  });
});

describe('EducationPage', () => {
  it('manages education and certifications on one page with a clean heading outline', async () => {
    vi.spyOn(adminApi.education, 'list').mockResolvedValue([
      { id: 1, institution: 'Example University', degree: 'B.Eng. IT', fieldOfStudy: null, startDate: '2022-09-01', endDate: null, description: '' },
    ]);
    vi.spyOn(adminApi.certifications, 'list').mockResolvedValue([
      { id: 2, name: 'Example Cert', issuer: 'Example Issuer', issuedOn: '2025-01-15', credentialUrl: null },
    ]);
    renderAdmin(<EducationPage />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Education' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: 'Certifications' })).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Education' })).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Certifications' })).toBeInTheDocument();
  });

  it('refuses a certification link that is not http(s)', async () => {
    vi.spyOn(adminApi.education, 'list').mockResolvedValue([]);
    vi.spyOn(adminApi.certifications, 'list').mockResolvedValue([]);
    const create = vi.spyOn(adminApi.certifications, 'create');
    renderAdmin(<EducationPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Add certification' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Certification name' }), 'Cert');
    await userEvent.type(screen.getByRole('textbox', { name: 'Issuer' }), 'Issuer');
    fireEvent.change(screen.getByLabelText(/Date issued/), { target: { value: '2025-01-15' } });
    await userEvent.type(screen.getByRole('textbox', { name: 'Credential link' }), 'javascript:alert(1)');
    await userEvent.click(screen.getByRole('button', { name: 'Save certification' }));

    expect(screen.getByText('Enter a valid http or https URL.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });
});
