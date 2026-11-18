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
