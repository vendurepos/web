import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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

test('changelog lists 0.3.0, 0.2.0 and 0.1.0 newest first', () => {
  const html = readFileSync(join('.next/server/app', 'docs/changelog.html'), 'utf8');
  const v030 = html.indexOf('0.3.0 (2026-10-06)');
  const v020 = html.indexOf('0.2.0 (2026-10-06)');
  const v010 = html.indexOf('0.1.0 (2026-10-01)');
  assert.ok(v030 >= 0);
  assert.ok(v020 >= 0);
  assert.ok(v010 >= 0);
  assert.ok(v030 < v020);
  assert.ok(v020 < v010);
  assert.ok(html.includes('TALLY-CUSTOM-ITEM'));
  assert.ok(html.includes('tallyEnsurePosTillRole'));
  assert.doesNotMatch(html, /Unreleased/);
});

test('llms text carries no MDX comments', () => {
  const full = readFileSync(join('.next/server/app', 'llms-full.txt.body'), 'utf8');
  const directory = join('.next/server/app', 'llms.mdx/docs');
  const files = readdirSync(directory).filter((file) => file.endsWith('.body'));
  assert.ok(files.length >= 7);
  const texts = [full, ...files.map((file) => readFileSync(join(directory, file), 'utf8'))];
  for (const text of texts) {
    assert.ok(!text.includes('{/*'));
    assert.ok(!text.includes('absence at vendurepos/app'));
  }
  assert.ok(full.includes('# Limitations'));
  assert.ok(full.includes('plugins: [/* your existing plugins, */ TallyPosPlugin],'));
});
