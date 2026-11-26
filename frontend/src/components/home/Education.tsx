import { useContent } from '../../content/ContentProvider';
import { formatMonthYear, formatRange, paragraphs } from '../../lib/format';
import { externalLinkProps, safeExternalUrl } from '../../lib/safeUrl';
import { AsyncState } from '../ui/AsyncState';
import { Icon } from '../ui/Icon';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';
import { Skeleton } from '../ui/Skeleton';

export function Education() {
  const { education, certifications } = useContent();
  const schools = education.data ?? [];
  const certs = certifications.data ?? [];
  const hasAnything = schools.length > 0 || certs.length > 0 || education.error || certifications.error;
  if (!hasAnything) return null; // optional section: absent until there is content

  return (
    <Section id="education" eyebrow="05 / Education" title="Education and certifications">
      <div className="grid gap-10 lg:grid-cols-2">
        {schools.length > 0 || education.error ? (
          <div>
            <h3 className="mb-5 text-lg font-semibold">Education</h3>
            <AsyncState loading={education.loading} error={education.error} onRetry={education.reload} label="education" skeleton={<Skeleton className="h-32" />}>
              <ul className="space-y-5">
                {schools.map((school) => (
                  <li key={school.id}>
                    <Reveal>
                      <article className="card p-6">
                        <p className="font-mono text-sm text-muted">{formatRange(school.startDate, school.endDate, !school.endDate)}</p>
                        <h4 className="mt-1 text-lg font-semibold">{school.degree}</h4>
                        <p className="text-muted">
                          {school.institution}
                          {school.fieldOfStudy ? ` · ${school.fieldOfStudy}` : ''}
                        </p>
                        {paragraphs(school.description).map((part, index) => (
                          <p key={index} className="mt-3">
                            {part}
                          </p>
                        ))}
                      </article>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </AsyncState>
          </div>
        ) : null}

        {certs.length > 0 || certifications.error ? (
          <div>
            <h3 className="mb-5 text-lg font-semibold">Certifications</h3>
            <AsyncState loading={certifications.loading} error={certifications.error} onRetry={certifications.reload} label="certifications" skeleton={<Skeleton className="h-32" />}>
              <ul className="space-y-5">
                {certs.map((cert) => {
                  const credential = safeExternalUrl(cert.credentialUrl);
                  return (
                    <li key={cert.id}>
                      <Reveal>
                        <article className="card p-6">
                          <p className="font-mono text-sm text-muted">{formatMonthYear(cert.issuedOn)}</p>
                          <h4 className="mt-1 text-lg font-semibold">{cert.name}</h4>
                          <p className="text-muted">{cert.issuer}</p>
                          {credential ? (
                            <a href={credential} {...externalLinkProps} className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-medium text-accent-text underline-offset-4 hover:underline">
                              View credential <Icon name="arrow-up-right" size={16} />
                              {' '}
                              <span className="sr-only">for {cert.name} (opens in a new tab)</span>
                            </a>
                          ) : null}
                        </article>
                      </Reveal>
                    </li>
                  );
                })}
              </ul>
            </AsyncState>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
