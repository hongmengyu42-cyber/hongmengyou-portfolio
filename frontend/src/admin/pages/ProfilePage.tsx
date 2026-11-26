import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import type { ProfileRequest } from '../../api/adminTypes';
import type { Profile } from '../../api/types';
import { useApi } from '../../api/useApi';
import { AsyncState } from '../../components/ui/AsyncState';
import { Icon } from '../../components/ui/Icon';
import { Skeleton } from '../../components/ui/Skeleton';
import { validateImageFile, validatePdfFile } from '../../lib/files';
import { PHOTO_OPTIONS, prepareImage } from '../../lib/imageResize';
import { usePageTitle } from '../../lib/usePageTitle';
import { FileUpload } from '../ui/FileUpload';
import { blankToNull, text, type FieldSpec, type Values } from '../ui/formSpec';
import { useNotify } from '../ui/Notifications';
import { ResourceForm } from '../ui/ResourceForm';

const specs: FieldSpec[] = [
  { name: 'fullName', label: 'Full name', kind: 'text', required: true, max: 100, autoComplete: 'name' },
  { name: 'headline', label: 'Headline', kind: 'text', required: true, max: 200, hint: 'Separate roles with “|”. The last part is shown as a small status line above your name.' },
  { name: 'intro', label: 'Intro', kind: 'textarea', rows: 3, max: 500, hint: 'One or two sentences shown in the hero.' },
  { name: 'professionalSummary', label: 'Professional summary', kind: 'textarea', rows: 5, max: 10000 },
  { name: 'background', label: 'Background', kind: 'textarea', rows: 5, max: 10000 },
  { name: 'careerGoals', label: 'Career goals', kind: 'textarea', rows: 4, max: 10000, hint: 'The About section appears once any of the three About fields has text.' },
  { name: 'publicEmail', label: 'Public email', kind: 'email', max: 254 },
  { name: 'githubUrl', label: 'GitHub URL', kind: 'url' },
  { name: 'linkedinUrl', label: 'LinkedIn URL', kind: 'url' },
  { name: 'seoTitle', label: 'SEO title', kind: 'text', max: 70, hint: 'Optional. Defaults to your name and first role.' },
  { name: 'seoDescription', label: 'SEO description', kind: 'textarea', rows: 2, max: 200, hint: 'Optional. Defaults to your intro.' },
];

const toForm = (p: Profile): Values => ({
  fullName: p.fullName, headline: p.headline, intro: p.intro, professionalSummary: p.professionalSummary,
  background: p.background, careerGoals: p.careerGoals, publicEmail: p.publicEmail ?? '', githubUrl: p.githubUrl ?? '',
  linkedinUrl: p.linkedinUrl ?? '', seoTitle: p.seoTitle ?? '', seoDescription: p.seoDescription ?? '',
});

const toRequest = (v: Values): ProfileRequest => ({
  fullName: text(v, 'fullName').trim(), headline: text(v, 'headline').trim(), intro: text(v, 'intro').trim(),
  background: text(v, 'background').trim(), careerGoals: text(v, 'careerGoals').trim(),
  professionalSummary: text(v, 'professionalSummary').trim(), publicEmail: blankToNull(text(v, 'publicEmail')),
  githubUrl: blankToNull(text(v, 'githubUrl')), linkedinUrl: blankToNull(text(v, 'linkedinUrl')),
  seoTitle: blankToNull(text(v, 'seoTitle')), seoDescription: blankToNull(text(v, 'seoDescription')),
});

export function ProfilePage() {
  usePageTitle('Profile');
  const notify = useNotify();
  const loaded = useApi((signal) => adminApi.profile.get(signal));
  const [profile, setProfile] = useState<Profile | null>(null);
  const [version, setVersion] = useState(0); // bumping it re-initialises the form with saved values

  useEffect(() => {
    if (loaded.data) setProfile(loaded.data);
  }, [loaded.data]);

  async function save(values: Values) {
    setProfile(await adminApi.profile.update(toRequest(values)));
    setVersion((n) => n + 1);
    notify('Profile saved.');
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Profile</h1>
      <AsyncState loading={loaded.loading} error={loaded.error} onRetry={loaded.reload} label="profile" skeleton={<Skeleton className="h-96" />}>
        {profile ? (
          <>
            <section aria-labelledby="profile-details" className="card p-6">
              <h2 id="profile-details" className="mb-5 text-xl font-semibold">
                Details
              </h2>
              <ResourceForm key={version} idPrefix="profile" specs={specs} initial={toForm(profile)} submitLabel="Save profile" onSubmit={save} />
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              <section aria-labelledby="avatar-heading" className="card p-6">
                <h2 id="avatar-heading" className="mb-4 text-xl font-semibold">
                  Profile photo
                </h2>
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.avatarAlt ?? ''} width={96} height={96} className="mb-4 h-24 w-24 rounded-full border border-line object-cover" />
                ) : (
                  <p className="mb-4 text-muted">No photo yet. The hero shows your initials until you upload one.</p>
                )}
                <FileUpload
                  label="Photo file"
                  accept="image/jpeg,image/png,image/webp"
                  altLabel="Alt text (describe the photo)"
                  buttonLabel="Upload photo"
                  validate={validateImageFile}
                  prepare={(file) => prepareImage(file, PHOTO_OPTIONS)}
                  hint="Up to 30 MB. Resized to 1400 px, and location data (EXIF) is removed. A portrait (4:5) photo with your face near the top works best."
                  onUpload={async (file, alt) => {
                    setProfile(await adminApi.profile.uploadAvatar(file, alt));
                    notify('Photo updated.');
                  }}
                />
              </section>

              <section aria-labelledby="cv-heading" className="card p-6">
                <h2 id="cv-heading" className="mb-4 text-xl font-semibold">
                  CV
                </h2>
                {profile.cvUrl ? (
                  <a href={profile.cvUrl} download className="mb-4 inline-flex min-h-11 items-center gap-2 font-medium text-accent-text underline-offset-4 hover:underline">
                    <Icon name="download" size={18} /> Current CV (PDF)
                  </a>
                ) : (
                  <p className="mb-4 text-muted">No CV yet. “Download CV” appears in the hero once you upload one.</p>
                )}
                <FileUpload
                  label="CV file (PDF)"
                  accept="application/pdf"
                  buttonLabel="Upload CV"
                  validate={validatePdfFile}
                  onUpload={async (file) => {
                    setProfile(await adminApi.profile.uploadCv(file));
                    notify('CV updated.');
                  }}
                />
              </section>
            </div>
          </>
        ) : null}
      </AsyncState>
    </div>
  );
}
