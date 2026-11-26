import { useContent } from '../../content/ContentProvider';
import { SocialLinks } from '../layout/SocialLinks';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';
import { ContactForm } from './ContactForm';

export function Contact() {
  const { profile } = useContent();
  return (
    <Section id="contact" eyebrow="06 / Contact" title="Let’s talk" tinted>
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="space-y-6 lg:col-span-5">
          <p className="text-lg text-muted">
            Have a project, an internship or a role in mind? Send a message, or reach me directly.
          </p>
          {profile.data ? <SocialLinks profile={profile.data} /> : null}
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-7">
          <ContactForm />
        </Reveal>
      </div>
    </Section>
  );
}
