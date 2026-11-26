import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminApi } from '../api/admin';
import { image } from '../test/adminFixtures';
import { profile } from '../test/fixtures';
import { renderAdmin } from '../test/render';
import { ImageManager } from './ImageManager';
import { ProfilePage } from './pages/ProfilePage';

/** A phone photo: 20 MB, 4000x3000. The browser stand-in shrinks it to a 150 kB JPEG. */
function stubPhoneBrowser() {
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 4000, height: 3000, close: vi.fn() }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/webp;base64,AAAA');
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) => callback(new Blob([new Uint8Array(150_000)], { type })));
}
const phoneJpeg = () => new File([new Uint8Array(20 * 1024 * 1024)], 'IMG_4821.JPG', { type: 'image/jpeg' });

afterEach(() => vi.unstubAllGlobals());

describe('large photos', () => {
  it('accepts a 20 MB profile photo, resizes it before upload and says what it is doing', async () => {
    stubPhoneBrowser();
    vi.spyOn(adminApi.profile, 'get').mockResolvedValue(profile);
    const upload = vi.spyOn(adminApi.profile, 'uploadAvatar').mockResolvedValue({ ...profile, avatarUrl: '/api/v1/files/me.jpg', avatarAlt: 'Portrait' });
    renderAdmin(<ProfilePage />);

    await userEvent.upload(await screen.findByLabelText('Photo file'), phoneJpeg());
    await userEvent.type(screen.getByRole('textbox', { name: /Alt text \(describe the photo\)/ }), 'Portrait');
    await userEvent.click(screen.getByRole('button', { name: 'Upload photo' }));

    expect(upload).toHaveBeenCalledTimes(1);
    const sent = upload.mock.calls[0]?.[0] as File;
    expect(sent.size).toBeLessThan(5 * 1024 * 1024); // what reaches the server fits its limit
    expect(sent.type).toBe('image/jpeg');
    expect(sent.name).toBe('IMG_4821.jpg');
    expect(await screen.findByRole('img', { name: 'Portrait' })).toBeInTheDocument();
  });

  it('resizes big screenshots too, as WebP when the browser supports it', async () => {
    stubPhoneBrowser();
    const upload = vi.spyOn(adminApi.projects, 'uploadImage').mockResolvedValue(image(1, { thumbnail: true, altText: 'Dash' }));
    renderAdmin(<ImageManager projectId={3} initialImages={[]} />);

    await userEvent.upload(screen.getByLabelText('Screenshot file'), new File([new Uint8Array(9 * 1024 * 1024)], 'dash.png', { type: 'image/png' }));
    await userEvent.type(screen.getByRole('textbox', { name: /Alt text \(describe what the screenshot shows\)/ }), 'Dash');
    await userEvent.click(screen.getByRole('button', { name: 'Upload screenshot' }));

    const sent = upload.mock.calls[0]?.[1] as File;
    expect(sent.type).toBe('image/webp');
    expect(sent.name).toBe('dash.webp');
    expect(sent.size).toBeLessThan(5 * 1024 * 1024);
  });

  it('tells the user plainly if an image is still too big after optimizing (browser cannot resize)', async () => {
    vi.stubGlobal('createImageBitmap', undefined); // no canvas support: the original is used as-is
    const upload = vi.spyOn(adminApi.profile, 'uploadAvatar');
    vi.spyOn(adminApi.profile, 'get').mockResolvedValue(profile);
    renderAdmin(<ProfilePage />);

    await userEvent.upload(await screen.findByLabelText('Photo file'), phoneJpeg());
    await userEvent.type(screen.getByRole('textbox', { name: /Alt text \(describe the photo\)/ }), 'Portrait');
    await userEvent.click(screen.getByRole('button', { name: 'Upload photo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('still larger than 5 MB after optimizing');
    expect(upload).not.toHaveBeenCalled();
  });

  it('still refuses absurdly large source files outright', async () => {
    const upload = vi.spyOn(adminApi.profile, 'uploadAvatar');
    vi.spyOn(adminApi.profile, 'get').mockResolvedValue(profile);
    renderAdmin(<ProfilePage />);

    await userEvent.upload(await screen.findByLabelText('Photo file'), new File([new Uint8Array(31 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' }));
    await userEvent.type(screen.getByRole('textbox', { name: /Alt text \(describe the photo\)/ }), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Upload photo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('under 30 MB');
    expect(upload).not.toHaveBeenCalled();
  });
});
