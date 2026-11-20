// Schema.org JSON-LD for search engines. No offers, price or rating: pricing is undecided.
import { GITHUB_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

const ORG_ID = `${SITE_URL}/#organization`;

export function homeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
        sameAs: ['https://github.com/vendurepos'],
      },
      {
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        license: 'https://opensource.org/licenses/MIT',
        isAccessibleForFree: true,
        sameAs: [GITHUB_URL],
        publisher: { '@id': ORG_ID },
      },
    ],
  };
}

export function docsBreadcrumbJsonLd(page: { url: string; title: string }) {
  const itemListElement = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Docs', item: `${SITE_URL}/docs` },
  ];
  if (page.url !== '/docs') {
    itemListElement.push({
      '@type': 'ListItem',
      position: 3,
      name: page.title,
      item: `${SITE_URL}${page.url}`,
    });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

// Round 65, J1 and J4 C7: docs pages describe themselves as articles. No dates or author: there is no reliable per-page date source.
export function docsArticleJsonLd(page: { url: string; title: string; description?: string }) {
  const url = `${SITE_URL}${page.url}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: page.title,
    ...(page.description ? { description: page.description } : {}),
    url,
    mainEntityOfPage: url,
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, url: SITE_URL },
  };
}
