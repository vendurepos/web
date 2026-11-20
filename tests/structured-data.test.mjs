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
  assert.equal(data.length, 2);
  assert.equal(data[0]['@type'], 'BreadcrumbList');
  assert.deepEqual(data[0].itemListElement, [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://vendurepos.com' },
    { '@type': 'ListItem', position: 2, name: 'Docs', item: 'https://vendurepos.com/docs' },
  ]);
});

test('docs page has a three-item BreadcrumbList ending at the page', () => {
  const data = blocks('docs/quick-start.html');
  assert.equal(data.length, 2);
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
  assert.equal(data.length, 2);
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

test('every docs page carries a TechArticle built from its own title and description (round 65, J1 and J4 C7)', () => {
  const pages = [
    ['docs.html', '/docs', 'Overview', 'What VendurePOS is, what it needs, and where it stands.'],
    [
      'docs/quick-start.html',
      '/docs/quick-start',
      'Quick start',
      'Install the plugin, configure Vendure and make your first sale.',
    ],
    [
      'docs/changelog.html',
      '/docs/changelog',
      'Changelog',
      'Released versions of the @vendurepos/plugin package, newest first.',
    ],
  ];
  for (const [file, path, headline, description] of pages) {
    const article = blocks(file)[1];
    assert.equal(article['@context'], 'https://schema.org');
    assert.equal(article['@type'], 'TechArticle');
    assert.equal(article.headline, headline);
    assert.equal(article.description, description);
    assert.equal(article.url, `https://vendurepos.com${path}`);
    assert.equal(article.mainEntityOfPage, `https://vendurepos.com${path}`);
    assert.equal(article.inLanguage, 'en');
    assert.equal(article.publisher['@id'], 'https://vendurepos.com/#organization');
    for (const key of ['datePublished', 'dateModified', 'author']) assert.ok(!(key in article), key);
  }
});
