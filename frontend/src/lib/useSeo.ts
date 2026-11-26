import { useEffect } from 'react';

interface SeoOptions {
  title: string;
  description?: string;
  /** Path such as "/projects/my-app"; combined with the current origin for canonical/og:url. */
  path?: string;
  image?: string | null;
  type?: 'website' | 'article';
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Keeps <head> correct while the visitor navigates inside the SPA. First-load crawler output comes from the
 * server (the /api/v1/seo/head fragment injected by nginx); this hook handles client-side route changes.
 */
export function useSeo({ title, description, path, image, type = 'website' }: SeoOptions): void {
  useEffect(() => {
    document.title = title;
    const origin = window.location.origin;
    const url = origin + (path ?? window.location.pathname);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', url);
    upsertMeta('name', 'twitter:title', title);
    if (description) {
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:description', description);
      upsertMeta('name', 'twitter:description', description);
    }
    if (image) {
      const absolute = image.startsWith('http') ? image : origin + image;
      upsertMeta('property', 'og:image', absolute);
      upsertMeta('name', 'twitter:image', absolute);
      upsertMeta('name', 'twitter:card', 'summary_large_image');
    }
  }, [title, description, path, image, type]);
}
