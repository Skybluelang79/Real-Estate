import { useEffect } from 'react';

const SITE_NAME = 'Dream Homes';
const DEFAULT_DESCRIPTION = 'Dream Homes — Your trusted partner in finding the perfect home. Browse luxury properties, apartments, and more.';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200';
const BASE_URL = 'https://dreamhomes-realestate.netlify.app';

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function Seo({ title, description, image, type = 'website', path = '', jsonLd }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;
    document.head.querySelector('meta[name="description"]')?.setAttribute('content', description || DEFAULT_DESCRIPTION);

    const ogImage = image || DEFAULT_IMAGE;
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description || DEFAULT_DESCRIPTION);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', `${BASE_URL}${path}`);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:site_name', SITE_NAME);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description || DEFAULT_DESCRIPTION);
    upsertMeta('name', 'twitter:image', ogImage);

    upsertLink('canonical', `${BASE_URL}${path}`);
    upsertLink('og:image:secure_url', ogImage);

    const defaultJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: BASE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/properties?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    const existingScript = document.getElementById('seo-jsonld');
    if (existingScript) existingScript.remove();
    const mergedJsonLd = { ...defaultJsonLd, ...jsonLd };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'seo-jsonld';
    script.textContent = JSON.stringify(mergedJsonLd);
    document.head.appendChild(script);

    return () => {
      const s = document.getElementById('seo-jsonld');
      if (s) s.remove();
    };
  }, [title, description, image, type, path, jsonLd]);

  return null;
}
