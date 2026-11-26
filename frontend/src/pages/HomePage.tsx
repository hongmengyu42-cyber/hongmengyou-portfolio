import { About } from '../components/home/About';
import { Contact } from '../components/home/Contact';
import { Education } from '../components/home/Education';
import { Experience } from '../components/home/Experience';
import { Hero, splitHeadline } from '../components/home/Hero';
import { Projects } from '../components/home/Projects';
import { Skills } from '../components/home/Skills';
import { useContent, useVisibleSections } from '../content/ContentProvider';
import { useSeo } from '../lib/useSeo';

export function HomePage() {
  const { profile } = useContent();
  const visible = new Set(useVisibleSections().map((section) => section.id));
  const data = profile.data;

  useSeo({
    title: data ? (data.seoTitle || `${data.fullName} | ${splitHeadline(data.headline).roles[0] ?? 'Portfolio'}`) : 'Portfolio',
    description: data ? (data.seoDescription || data.intro) : undefined,
    path: '/',
    image: data?.avatarUrl,
  });

  return (
    <>
      <Hero />
      {visible.has('about') ? <About /> : null}
      <Skills />
      <Projects />
      <Experience />
      <Education />
      <Contact />
    </>
  );
}

export default HomePage;
