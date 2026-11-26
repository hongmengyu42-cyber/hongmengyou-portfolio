import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi } from '../api/admin';
import { ApiError } from '../api/client';
import { image } from '../test/adminFixtures';
import { expectNoAxeViolations, renderAdmin } from '../test/render';
import { ImageManager } from './ImageManager';

const png = (name = 'shot.png', size = 10) => new File([new Uint8Array(size)], name, { type: 'image/png' });
const lenient = () => userEvent.setup({ applyAccept: false }); // lets tests choose files the picker would normally hide
const fileInput = () => screen.getByLabelText('Screenshot file');
const altInput = () => screen.getByRole('textbox', { name: /Alt text \(describe what the screenshot shows\)/ });

describe('ImageManager: uploading', () => {
  it('requires a file and alt text before sending anything', async () => {
    const upload = vi.spyOn(adminApi.projects, 'uploadImage');
    renderAdmin(<ImageManager projectId={1} initialImages={[]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Upload screenshot' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a file first.');

    await userEvent.upload(fileInput(), png());
    await userEvent.click(screen.getByRole('button', { name: 'Upload screenshot' }));
    expect(screen.getByRole('alert')).toHaveTextContent('is required so the image is accessible');
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects the wrong type and oversized files before upload', async () => {
    const user = lenient();
    const upload = vi.spyOn(adminApi.projects, 'uploadImage');
    renderAdmin(<ImageManager projectId={1} initialImages={[]} />);
    await user.type(altInput(), 'Alt');

    await user.upload(fileInput(), new File(['GIF89a'], 'anim.gif', { type: 'image/gif' }));
    await user.click(screen.getByRole('button', { name: 'Upload screenshot' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPG, PNG or WebP image.');

    await user.upload(fileInput(), png('huge.png', 5 * 1024 * 1024 + 1));
    await user.click(screen.getByRole('button', { name: 'Upload screenshot' }));
    expect(screen.getByRole('alert')).toHaveTextContent('larger than 5 MB');
    expect(upload).not.toHaveBeenCalled();
  });

  it('uploads with the file and alt text, shows the new screenshot, and clears the form', async () => {
    const upload = vi.spyOn(adminApi.projects, 'uploadImage').mockResolvedValue(image(5, { thumbnail: true, altText: 'A dashboard' }));
    renderAdmin(<ImageManager projectId={4} initialImages={[]} />);
    const file = png('dash.png');

    await userEvent.upload(fileInput(), file);
    await userEvent.type(altInput(), 'A dashboard');
    await userEvent.click(screen.getByRole('button', { name: 'Upload screenshot' }));

    expect(upload).toHaveBeenCalledWith(4, file, 'A dashboard');
    expect(await screen.findByRole('img', { name: 'A dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Thumbnail')).toBeInTheDocument();
    expect(altInput()).toHaveValue('');
  });

  it('shows the server reason when the upload is refused, and keeps the form for another try', async () => {
    vi.spyOn(adminApi.projects, 'uploadImage').mockRejectedValue(new ApiError(400, 'The file content is not a valid JPEG, PNG or WebP image.'));
    renderAdmin(<ImageManager projectId={1} initialImages={[]} />);
    await userEvent.upload(fileInput(), png());
    await userEvent.type(altInput(), 'Alt');
    await userEvent.click(screen.getByRole('button', { name: 'Upload screenshot' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('not a valid JPEG, PNG or WebP image');
    expect(altInput()).toHaveValue('Alt');
  });
});

describe('ImageManager: managing', () => {
  const three = () => [image(1, { thumbnail: true }), image(2), image(3)];
  const names = () => within(screen.getByRole('list', { name: 'Uploaded screenshots' })).getAllByRole('img').map((img) => img.getAttribute('alt'));

  it('lists screenshots with real alt text and exposes the thumbnail', () => {
    renderAdmin(<ImageManager projectId={1} initialImages={three()} />);
    expect(names()).toEqual(['Screenshot 1', 'Screenshot 2', 'Screenshot 3']);
    expect(screen.getByRole('button', { name: 'Set as thumbnail (image 1)' })).toBeDisabled();
  });

  it('changes the thumbnail', async () => {
    const set = vi.spyOn(adminApi.projects, 'setThumbnail').mockResolvedValue();
    renderAdmin(<ImageManager projectId={9} initialImages={three()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Set as thumbnail (image 3)' }));

    expect(set).toHaveBeenCalledWith(9, 3);
    expect(screen.getByRole('button', { name: 'Set as thumbnail (image 3)' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Set as thumbnail (image 1)' })).toBeEnabled();
  });

  it('reorders by sending the full order, and rolls back on failure', async () => {
    const reorder = vi.spyOn(adminApi.projects, 'reorderImages').mockResolvedValueOnce().mockRejectedValueOnce(new ApiError(409, 'Out of sync'));
    renderAdmin(<ImageManager projectId={9} initialImages={three()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Move image 1 later' }));
    expect(reorder).toHaveBeenLastCalledWith(9, [2, 1, 3]);
    expect(names()).toEqual(['Screenshot 2', 'Screenshot 1', 'Screenshot 3']);

    await userEvent.click(screen.getByRole('button', { name: 'Move image 2 later' }));
    expect(await screen.findByText(/Could not reorder screenshots: Out of sync/)).toBeInTheDocument();
    expect(names()).toEqual(['Screenshot 2', 'Screenshot 1', 'Screenshot 3']); // unchanged after the failed move
  });

  it('saves edited alt text, and refuses an empty one', async () => {
    const update = vi.spyOn(adminApi.projects, 'updateImageAlt').mockResolvedValue(image(2, { altText: 'Better description' }));
    renderAdmin(<ImageManager projectId={9} initialImages={three()} />);
    const field = screen.getByRole('textbox', { name: 'Alt text for image 2' });

    await userEvent.clear(field);
    await userEvent.type(field, 'Better description');
    await userEvent.click(screen.getByRole('button', { name: /Save alt text for image 2/ }));
    expect(update).toHaveBeenCalledWith(9, 2, 'Better description');
    expect(await screen.findByRole('img', { name: 'Better description' })).toBeInTheDocument();

    await userEvent.clear(field);
    await userEvent.type(field, ' ');
    await userEvent.click(screen.getByRole('button', { name: /Save alt text for image 2/ }));
    expect(await screen.findByText('Alt text cannot be empty.')).toBeInTheDocument();
  });

  it('confirms before deleting, and promotes the next screenshot when the thumbnail is removed', async () => {
    const remove = vi.spyOn(adminApi.projects, 'removeImage').mockResolvedValue();
    renderAdmin(<ImageManager projectId={9} initialImages={three()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete image 1' }));
    expect(remove).not.toHaveBeenCalled();
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Delete screenshot?' })).getByRole('button', { name: 'Delete' }));

    expect(remove).toHaveBeenCalledWith(9, 1);
    expect(names()).toEqual(['Screenshot 2', 'Screenshot 3']);
    expect(screen.getByText('Thumbnail')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set as thumbnail (image 1)' })).toBeDisabled(); // old #2 is now first and thumbnail
  });

  it('has no structural accessibility violations', async () => {
    const { container } = renderAdmin(<ImageManager projectId={1} initialImages={three()} />);
    await expectNoAxeViolations(container);
  });
});
