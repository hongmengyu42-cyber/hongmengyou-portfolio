import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../api/client';
import { profile } from '../../test/fixtures';
import { expectNoAxeViolations, renderAdmin } from '../../test/render';
import { ProfilePage } from './ProfilePage';

describe('ProfilePage', () => {
  it('loads the profile into the form and saves it, turning blank optional fields into null', async () => {
    vi.spyOn(adminApi.profile, 'get').mockResolvedValue({ ...profile, githubUrl: 'https://github.com/example-test' });
    const update = vi.spyOn(adminApi.profile, 'update').mockResolvedValue(profile);
    renderAdmin(<ProfilePage />);

    expect(await screen.findByRole('textbox', { name: 'Full name' })).toHaveValue('Test Person');
    expect(screen.getByRole('textbox', { name: 'GitHub URL' })).toHaveValue('https://github.com/example-test');

    await userEvent.clear(screen.getByRole('textbox', { name: 'GitHub URL' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Intro' }), ' More.');
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Test Person', intro: 'Intro sentence for tests. More.', githubUrl: null, publicEmail: null, seoTitle: null,
    }));
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument();
  });

  it('validates name, headline, email and URLs before saving', async () => {
    vi.spyOn(adminApi.profile, 'get').mockResolvedValue(profile);
    const update = vi.spyOn(adminApi.profile, 'update');
    renderAdmin(<ProfilePage />);

    await userEvent.clear(await screen.findByRole('textbox', { name: 'Full name' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Public email' }), 'not-an-email');
    await userEvent.type(screen.getByRole('textbox', { name: 'LinkedIn URL' }), 'javascript:alert(1)');
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(screen.getByText('Full name is required.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid http or https URL.')).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it('uploads a photo with required alt text and shows it', async () => {
    vi.spyOn(adminApi.profile, 'get').mockResolvedValue(profile);
    const upload = vi.spyOn(adminApi.profile, 'uploadAvatar').mockResolvedValue({ ...profile, avatarUrl: '/api/v1/files/me.png', avatarAlt: 'Portrait of Test Person' });
    renderAdmin(<ProfilePage />);
    const file = new File([new Uint8Array(8)], 'me.png', { type: 'image/png' });

    await userEvent.upload(await screen.findByLabelText('Photo file'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Upload photo' }));
    expect(screen.getByRole('alert')).toHaveTextContent('is required so the image is accessible');

    await userEvent.type(screen.getByRole('textbox', { name: /Alt text \(describe the photo\)/ }), 'Portrait of Test Person');
    await userEvent.click(screen.getByRole('button', { name: 'Upload photo' }));

    expect(upload).toHaveBeenCalledWith(file, 'Portrait of Test Person');
    expect(await screen.findByRole('img', { name: 'Portrait of Test Person' })).toBeInTheDocument();
  });

  it('accepts only PDFs for the CV and links the current one', async () => {
    vi.spyOn(adminApi.profile, 'get').mockResolvedValue({ ...profile, cvUrl: '/api/v1/files/cv.pdf' });
    const upload = vi.spyOn(adminApi.profile, 'uploadCv').mockResolvedValue(profile);
    const user = userEvent.setup({ applyAccept: false });
    renderAdmin(<ProfilePage />);

    expect(await screen.findByRole('link', { name: /Current CV/ })).toHaveAttribute('href', '/api/v1/files/cv.pdf');

    await user.upload(screen.getByLabelText('CV file (PDF)'), new File(['x'], 'cv.docx', { type: 'application/msword' }));
    await user.click(screen.getByRole('button', { name: 'Upload CV' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a PDF file.');
    expect(upload).not.toHaveBeenCalled();

    const pdf = new File(['%PDF-1.7'], 'cv.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText('CV file (PDF)'), pdf);
    await user.click(screen.getByRole('button', { name: 'Upload CV' }));
    expect(upload).toHaveBeenCalledWith(pdf);
  });

  it('shows a load error with retry', async () => {
    vi.spyOn(adminApi.profile, 'get').mockRejectedValueOnce(new ApiError(500, 'Down')).mockResolvedValueOnce(profile);
    renderAdmin(<ProfilePage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('textbox', { name: 'Full name' })).toBeInTheDocument();
  });

  it('has no structural accessibility violations', async () => {
    vi.spyOn(adminApi.profile, 'get').mockResolvedValue(profile);
    const { container } = renderAdmin(<ProfilePage />);
    await screen.findByRole('textbox', { name: 'Full name' });
    await expectNoAxeViolations(container);
  });
});
