import { source } from '@/lib/source';
import { joinContentLines } from '@/lib/search-index';
import { createFromSource } from 'fumadocs-core/search/server';

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
  // The default index, with each paragraph's source hard wraps joined (createFromSource adds the breadcrumbs).
  buildIndex: (page) => ({
    title: page.data.title,
    description: page.data.description,
    url: page.url,
    id: page.url,
    structuredData: joinContentLines(page.data.structuredData),
  }),
});
