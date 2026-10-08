// Marketing backlog item 92: rewrite sitemap locs onto the local server so CI never checks the live site.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const DEFAULT_SITEMAP = '.next/server/app/sitemap.xml.body';
export const DEFAULT_ORIGIN = 'http://localhost:3000';

export function sitemapSeeds(xml, origin = DEFAULT_ORIGIN) {
  const locs = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)];
  if (!/<urlset\b/.test(xml) || locs.length === 0) {
    throw new Error('sitemap must contain a urlset and at least one loc');
  }
  return [
    { source: '/', url: new URL('/', origin).href },
    ...locs.map((match) => {
      const loc = new URL(match[1].trim());
      return { source: 'sitemap', url: new URL(loc.pathname + loc.search, origin).href };
    }),
  ];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const seeds = sitemapSeeds(readFileSync(process.argv[2] ?? DEFAULT_SITEMAP, 'utf8'), process.argv[3] ?? DEFAULT_ORIGIN);
  for (const seed of seeds) {
    console.error(`seed (${seed.source}): ${seed.url}`);
  }
  console.error(`${seeds.length} link-check seeds`);
  console.log(seeds.map((seed) => seed.url).join('\n'));
}
