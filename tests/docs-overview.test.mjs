import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const html = readFileSync(join('.next/server/app', 'docs.html'), 'utf8');
const anchors = Array.from(html.matchAll(/<a ([^>]*)>([^<]*)/g), ([, attrs, text]) => ({ attrs, text }));
const href = ({ attrs }) => attrs.match(/href="([^"]*)"/)?.[1];

test('docs overview next steps link plugin setup, not quick start', () => {
  // Fumadocs marks each <Card> anchor with data-card="true"; the Next steps grid holds the only cards on the page.
  const cards = anchors.filter(({ attrs }) => attrs.includes('data-card="true"')).map(href);
  assert.deepEqual(cards, ['https://demo.vendurepos.com/demo', '/docs/plugin-setup', 'https://github.com/vendurepos/app']);
  // The pager below the page still leads to Quick start.
  assert.ok(anchors.some((a) => href(a) === '/docs/quick-start' && !a.attrs.includes('data-card')));
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
  assert.ok(text(home.slice(start, home.indexOf('</ul>', start))).includes('^20.19 || >=22.12'));
});
