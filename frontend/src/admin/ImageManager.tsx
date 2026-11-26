import { useState } from 'react';
import { adminApi } from '../api/admin';
import { ApiError } from '../api/client';
import type { ProjectImage } from '../api/types';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { validateImageFile } from '../lib/files';
import { prepareImage, SCREENSHOT_OPTIONS } from '../lib/imageResize';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { FileUpload } from './ui/FileUpload';
import { inputClass } from './ui/FormFields';
import { useNotify } from './ui/Notifications';

const message = (error: unknown) => (error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');

/** Re-numbers sortOrder to match array position, the same rule the server applies. */
const renumber = (images: ProjectImage[]): ProjectImage[] => images.map((image, index) => ({ ...image, sortOrder: index }));

function ImageRow({ image, index, count, projectId, onAlt, onThumbnail, onMove, onDelete }: {
  image: ProjectImage; index: number; count: number; projectId: number;
  onAlt: (updated: ProjectImage) => void; onThumbnail: () => void; onMove: (delta: -1 | 1) => void; onDelete: () => void;
}) {
  const notify = useNotify();
  const [alt, setAlt] = useState(image.altText);
  const [saving, setSaving] = useState(false);
  const label = `image ${index + 1}`;

  async function saveAlt() {
    if (!alt.trim()) return notify('Alt text cannot be empty.', 'error');
    setSaving(true);
    try {
      onAlt(await adminApi.projects.updateImageAlt(projectId, image.id, alt.trim()));
      notify('Alt text saved.');
    } catch (error) {
      notify(`Could not save alt text: ${message(error)}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="card flex flex-col gap-4 p-4 sm:flex-row">
      <img src={image.url} alt={image.altText} width={image.width} height={image.height} loading="lazy" decoding="async" className="aspect-[16/10] w-full rounded-control border border-line bg-surface-2 object-cover sm:w-56" />
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted">#{index + 1}</span>
          {image.thumbnail ? <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-accent-text">Thumbnail</span> : null}
        </div>
        <div>
          <label htmlFor={`alt-${image.id}`} className="mb-1.5 block text-sm font-medium">
            Alt text for {label}
          </label>
          <div className="flex gap-2">
            <input id={`alt-${image.id}`} type="text" maxLength={200} value={alt} onChange={(e) => setAlt(e.target.value)} className={inputClass} />
            <Button variant="secondary" onClick={saveAlt} disabled={saving || alt.trim() === image.altText}>
              Save{' '}
              <span className="sr-only">alt text for {label}</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="!min-h-9 !px-3" onClick={onThumbnail} disabled={image.thumbnail}>
            Set as thumbnail{' '}
            <span className="sr-only">({label})</span>
          </Button>
          <Button variant="secondary" className="!min-h-9 !px-2.5" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${label} earlier`}>
            <Icon name="arrow-up" size={16} />
          </Button>
          <Button variant="secondary" className="!min-h-9 !px-2.5" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${label} later`}>
            <Icon name="arrow-down" size={16} />
          </Button>
          <Button variant="secondary" className="!min-h-9 !px-3" onClick={onDelete} aria-label={`Delete ${label}`}>
            <Icon name="trash" size={16} /> Delete
          </Button>
        </div>
      </div>
    </li>
  );
}

export function ImageManager({ projectId, initialImages }: { projectId: number; initialImages: ProjectImage[] }) {
  const notify = useNotify();
  const [images, setImages] = useState<ProjectImage[]>(initialImages);
  const [deleting, setDeleting] = useState<ProjectImage | null>(null);

  async function upload(file: File, altText: string) {
    const created = await adminApi.projects.uploadImage(projectId, file, altText);
    setImages((current) => [...current, created]);
    notify('Screenshot uploaded.');
  }

  async function setThumbnail(image: ProjectImage) {
    try {
      await adminApi.projects.setThumbnail(projectId, image.id);
      setImages((current) => current.map((item) => ({ ...item, thumbnail: item.id === image.id })));
      notify('Thumbnail updated.');
    } catch (error) {
      notify(`Could not set the thumbnail: ${message(error)}`, 'error');
    }
  }

  async function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    const first = images[index];
    const second = images[target];
    if (!first || !second) return;
    const previous = images;
    const next = [...images];
    next[index] = second;
    next[target] = first;
    setImages(renumber(next));
    try {
      await adminApi.projects.reorderImages(projectId, next.map((image) => image.id));
    } catch (error) {
      setImages(previous);
      notify(`Could not reorder screenshots: ${message(error)}`, 'error');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    await adminApi.projects.removeImage(projectId, deleting.id);
    setImages((current) => {
      const remaining = renumber(current.filter((image) => image.id !== deleting.id));
      // The server promotes the first remaining image when the thumbnail is deleted; mirror that here.
      if (deleting.thumbnail && remaining[0]) remaining[0] = { ...remaining[0], thumbnail: true };
      return remaining;
    });
    notify('Screenshot deleted.');
    setDeleting(null);
  }

  return (
    <section aria-labelledby="images-heading" className="card p-6">
      <h2 id="images-heading" className="mb-1 text-xl font-semibold">
        Screenshots
      </h2>
      <p className="mb-5 text-sm text-muted">JPG, PNG or WebP. Large images are resized in your browser before upload. The first upload becomes the thumbnail. Alt text is required.</p>

      <FileUpload
        label="Screenshot file"
        accept="image/jpeg,image/png,image/webp"
        altLabel="Alt text (describe what the screenshot shows)"
        buttonLabel="Upload screenshot"
        validate={validateImageFile}
        prepare={(file) => prepareImage(file, SCREENSHOT_OPTIONS)}
        hint="Up to 30 MB. Resized to 2000 px and optimized automatically."
        onUpload={upload}
      />

      {images.length === 0 ? (
        <p className="mt-6 text-muted">No screenshots yet.</p>
      ) : (
        <ul aria-label="Uploaded screenshots" className="mt-6 space-y-4">
          {images.map((image, index) => (
            <ImageRow
              key={image.id}
              image={image}
              index={index}
              count={images.length}
              projectId={projectId}
              onAlt={(updated) => setImages((current) => current.map((item) => (item.id === updated.id ? updated : item)))}
              onThumbnail={() => setThumbnail(image)}
              onMove={(delta) => move(index, delta)}
              onDelete={() => setDeleting(image)}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete screenshot?"
        message="This screenshot will be permanently removed from the project."
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}
