import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { source } from '@/lib/source';
import { pageLastModified } from '@/lib/page-dates';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: pageLastModified('app/(home)/page.tsx') },
    ...source.getPages().map((page) => ({
      url: new URL(page.url, SITE_URL).toString(),
      lastModified: pageLastModified(`content/docs/${page.path}`),
    })),
  ];
}
