import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const blockPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const pages = [
  ['plugin-setup', 'Plugin setup'],
  ['connect-a-till', 'Connect a till'],
  ['at-the-till', 'At the till'],
  ['troubleshooting', 'Troubleshooting'],
  ['limitations', 'Limitations'],
];

for (const [slug, title] of pages) {
  test(`${slug} is built with its canonical, breadcrumb and sitemap entry`, () => {
    const html = readFileSync(join('.next/server/app', `docs/${slug}.html`), 'utf8');
    const url = `https://vendurepos.com/docs/${slug}`;
    assert.ok(html.includes(`<link rel="canonical" href="${url}"/>`));
    const data = Array.from(html.matchAll(blockPattern), ([, body]) => JSON.parse(body));
    assert.equal(data.length, 1);
    assert.equal(data[0]['@type'], 'BreadcrumbList');
    assert.equal(data[0].itemListElement.length, 3);
    assert.deepEqual(data[0].itemListElement[2], {
      '@type': 'ListItem',
      position: 3,
      name: title,
      item: url,
    });
    const sitemap = readFileSync(join('.next/server/app', 'sitemap.xml.body'), 'utf8');
    assert.ok(sitemap.includes(`<loc>${url}</loc>`));
    assert.doesNotMatch(html, /X report/);
  });
}

test('home links the limitations page', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  assert.ok(html.includes('href="/docs/limitations"'));
});
