import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const blockPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

function blocks(file) {
  const html = readFileSync(join('.next/server/app', file), 'utf8');
  return Array.from(html.matchAll(blockPattern), ([, body]) => JSON.parse(body));
}

test('home has one JSON-LD block with Organization and SoftwareApplication', () => {
  const data = blocks('index.html');
  assert.equal(data.length, 1);
  assert.equal(data[0]['@context'], 'https://schema.org');
  const org = data[0]['@graph'].find((item) => item['@type'] === 'Organization');
  assert.ok(org);
  assert.equal(org.name, 'VendurePOS');
  assert.equal(org.url, 'https://vendurepos.com');
  assert.equal(org.logo, 'https://vendurepos.com/icon.svg');
  assert.ok(org.sameAs.includes('https://github.com/vendurepos'));
  const app = data[0]['@graph'].find((item) => item['@type'] === 'SoftwareApplication');
  assert.ok(app);
  assert.equal(app.applicationCategory, 'BusinessApplication');
  assert.equal(app.operatingSystem, 'Web');
  assert.equal(app.license, 'https://opensource.org/licenses/MIT');
});

test('no block carries offers, price or rating', () => {
  for (const file of ['index.html', 'docs.html', 'docs/quick-start.html']) {
    const html = readFileSync(join('.next/server/app', file), 'utf8');
    for (const [, body] of html.matchAll(blockPattern)) {
      assert.doesNotMatch(body, /"(?:offers|price|aggregateRating)"/);
    }
  }
});

test('docs index has a two-item BreadcrumbList', () => {
  const data = blocks('docs.html');
  assert.equal(data.length, 1);
  assert.equal(data[0]['@type'], 'BreadcrumbList');
  assert.deepEqual(data[0].itemListElement, [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://vendurepos.com' },
    { '@type': 'ListItem', position: 2, name: 'Docs', item: 'https://vendurepos.com/docs' },
  ]);
});

test('docs page has a three-item BreadcrumbList ending at the page', () => {
  const data = blocks('docs/quick-start.html');
  assert.equal(data.length, 1);
  assert.equal(data[0]['@type'], 'BreadcrumbList');
  assert.equal(data[0].itemListElement.length, 3);
  assert.deepEqual(data[0].itemListElement[2], {
    '@type': 'ListItem',
    position: 3,
    name: 'Quick start',
    item: 'https://vendurepos.com/docs/quick-start',
  });
});

test('changelog page is built, in the sitemap, and its breadcrumb ends at Changelog', () => {
  const data = blocks('docs/changelog.html');
  assert.equal(data.length, 1);
  assert.equal(data[0]['@type'], 'BreadcrumbList');
  assert.deepEqual(data[0].itemListElement[2], {
    '@type': 'ListItem',
    position: 3,
    name: 'Changelog',
    item: 'https://vendurepos.com/docs/changelog',
  });
  const sitemap = readFileSync(join('.next/server/app', 'sitemap.xml.body'), 'utf8');
  assert.ok(sitemap.includes('<loc>https://vendurepos.com/docs/changelog</loc>'));
  const home = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  assert.ok(home.includes('href="/docs/changelog"'));
});
