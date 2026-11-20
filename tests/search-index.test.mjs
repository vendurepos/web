// Round 62, J4 C7: search results show each paragraph on one line, without the source's hard line breaks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { joinContentLines } from '../lib/search-index.ts';

test('search contents join the source hard wraps with one space (round 62, J4 C7)', () => {
  const wrapped =
    'Once the catalogue has synced, the till keeps selling offline while its tab stays open. Customer search and adding a\ncustomer need a connection to the store.';
  const input = {
    headings: [{ id: 'offline', content: 'Offline' }],
    contents: [
      { heading: 'offline', content: wrapped },
      { heading: 'offline', content: 'Reloading the tab needs a connection.' },
    ],
  };
  const before = structuredClone(input);
  const out = joinContentLines(input);
  assert.equal(
    out.contents[0].content,
    'Once the catalogue has synced, the till keeps selling offline while its tab stays open. Customer search and adding a customer need a connection to the store.',
  );
  assert.ok(!out.contents[0].content.includes('\n'));
  assert.equal(out.contents[1].content, 'Reloading the tab needs a connection.');
  assert.deepEqual(out.contents.map((c) => c.heading), ['offline', 'offline']);
  assert.deepEqual(out.headings, before.headings);
  assert.deepEqual(input, before);
});

test('the search route builds its index through joinContentLines', () => {
  // A text guard: the route itself needs the Next runtime (fumadocs-mdx collections) to execute.
  const route = readFileSync(new URL('../app/api/search/route.ts', import.meta.url), 'utf8');
  assert.match(route, /import \{ joinContentLines \} from '@\/lib\/search-index';/);
  assert.match(route, /buildIndex/);
});
