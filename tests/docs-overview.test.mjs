import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const html = readFileSync(join('.next/server/app', 'docs.html'), 'utf8');
const anchors = Array.from(html.matchAll(/<a ([^>]*)>([^<]*)/g), ([, attrs, text]) => ({ attrs, text }));
const href = ({ attrs }) => attrs.match(/href="([^"]*)"/)?.[1];

// Round 36, J4 C4: Next steps left out Quick start, which sat alone in the pager below.
test('docs overview next steps link quick start and plugin setup', () => {
  // Fumadocs marks each <Card> anchor with data-card="true"; the Next steps grid holds the only cards on the page.
  const cards = anchors.filter(({ attrs }) => attrs.includes('data-card="true"')).map(href);
  assert.deepEqual(cards, [
    '/docs/quick-start',
    'https://demo.vendurepos.com/demo',
    '/docs/plugin-setup',
    '/docs/at-the-till',
    '/docs/limitations',
    'https://github.com/vendurepos/app',
  ]);
  // Round 38, J4 C4: no pager below the Overview; its Next steps card is the one link to Quick start.
  const text = html.replace(/<script\b[\s\S]*?<\/script>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  assert.equal(text.split('Install the plugin, configure Vendure and make your first sale.').length - 1, 1);
});

test('quick start keeps its pager to plugin setup', () => {
  const page = readFileSync(join('.next/server/app', 'docs/quick-start.html'), 'utf8');
  const main = page.replace(/<script\b[\s\S]*?<\/script>/g, ' ').split('</aside>').slice(1).join('</aside>');
  const links = Array.from(main.matchAll(/<a ([^>]*)>([\s\S]*?)<\/a>/g), ([, attrs, inner]) => ({ attrs, inner }));
  assert.ok(links.some((a) => href(a) === '/docs/plugin-setup' && !a.attrs.includes('data-active') && a.inner.includes('Plugin setup')));
});

test('docs overview marks only the sidebar Overview item active', () => {
  const active = anchors.filter(({ attrs }) => attrs.includes('data-active="true"')).map((a) => [href(a), a.text]);
  assert.deepEqual(active, [['/docs', 'Overview']]);
});

// Round 34, J2 C3: "an administrator account" read as a full admin login, against Connect a till's limited role.
test('docs overview names a staff account or a device key and links Connect a till', () => {
  // The page description is a <p class="…">; the first bare <p> is the body's first paragraph.
  const paragraph = html.match(/<p>(?:(?!<\/p>)[\s\S])*<\/p>/)?.[0] ?? '';
  const text = paragraph.replace(/<[^>]*>/g, '');
  assert.match(text, /^VendurePOS is an open-source point of sale/);
  assert.ok(text.includes('with a staff account or a device key'), text);
  assert.ok(!text.includes('administrator account'), text);
  assert.ok(paragraph.includes('href="/docs/connect-a-till"'));
});

// Round 35, J1/J5 C4: the requirement lists left out the Node range Quick start requires.
test('overview and home requirements name the plugin Node range', () => {
  const text = (slice) =>
    slice
      .replace(/<[^>]*>/g, '')
      .replace(/&gt;|&#x3e;|&#62;/gi, '>')
      .replace(/&vert;|&verbar;|&#x7c;|&#124;/gi, '|');
  const requirements = html.indexOf('<h2 id="requirements"');
  assert.ok(requirements >= 0, 'a Requirements heading');
  assert.ok(text(html.slice(requirements, html.indexOf('<h2', requirements + 1))).includes('^20.19 || >=22.12'));
  const home = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const start = home.indexOf('Before you start');
  assert.ok(start >= 0, 'a Before you start heading');
  assert.ok(text(home.slice(start, home.indexOf('</section>', start))).includes('^20.19 || >=22.12'));
});

// Round 36, J5 C4: "3.6 or later" read as including 4.x; the plugin's peer range is ^3.6.0.
test('the Vendure range reads the same on home, overview and plugin setup', () => {
  const text = (page) =>
    readFileSync(join('.next/server/app', page), 'utf8')
      .replace(/<[^>]*>/g, '')
      .replace(/&#x27;|&#39;|&apos;/gi, "'")
      .replace(/&quot;|&#x22;|&#34;/gi, '"')
      .replace(/\s+/g, ' ');
  const pages = Object.fromEntries(['docs.html', 'index.html', 'docs/plugin-setup.html'].map((p) => [p, text(p)]));
  for (const [page, body] of Object.entries(pages)) {
    assert.ok(body.includes('3.6 or a later 3.x release'), page);
    assert.ok(!body.includes('3.6 or later'), page);
  }
  assert.ok(pages['docs/plugin-setup.html'].includes("import { runMigrations } from '@vendure/core'"));
});

// Round 36, J4 C4: Next steps left out Quick start, which sat alone in the pager below.
test('overview next steps lead with Quick start, two by two', () => {
  const heading = html.indexOf('<h2 id="next-steps"');
  assert.ok(heading >= 0, 'a Next steps heading');
  const grid = html.indexOf('<div', heading);
  // Walk the div tags from the grid's opening tag to its matching close.
  let depth = 0;
  let end = -1;
  for (const tag of html.slice(grid).matchAll(/<(\/?)div\b/g)) {
    depth += tag[1] ? -1 : 1;
    if (depth === 0) {
      end = grid + tag.index;
      break;
    }
  }
  assert.ok(end > grid, 'the cards grid closes');
  const slice = html.slice(heading, end);
  const gridClass = slice.match(/<div [^>]*class="([^"]*)"/)?.[1] ?? '';
  assert.ok(gridClass.includes('sm:grid-cols-2'), gridClass);
  assert.ok(!gridClass.includes('sm:grid-cols-3'), gridClass);
  const cards = Array.from(slice.matchAll(/<a ([^>]*data-card="true"[^>]*)>/g), ([, attrs]) => href({ attrs }));
  assert.equal(cards.length, 6);
  assert.equal(cards[0], '/docs/quick-start');
});

test('overview next steps give owners At the till and Limitations, in their pages\' own words (round 72, J2 C4)', () => {
  const text = html.replace(/<script\b[\s\S]*?<\/script>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  for (const [slug, title] of [['at-the-till', 'At the till'], ['limitations', 'Limitations']]) {
    const page = readFileSync(join('content/docs', `${slug}.mdx`), 'utf8');
    const description = page.match(/^description: (.+)$/m)[1];
    assert.ok(text.includes(`${title} ${description}`), `${title} uses its page description`);
  }
});
