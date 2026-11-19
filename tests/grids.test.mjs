import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('home feature grid uses two columns from the small breakpoint', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  assert.ok(!html.includes('lg:grid-cols-3'));
  assert.ok(html.includes('sm:grid-cols-2'));
});

// Round 36, J4 C4: Next steps left out Quick start, which sat alone in the pager below.
test('docs next steps grid uses two columns from the small breakpoint', () => {
  const html = readFileSync(join('.next/server/app', 'docs.html'), 'utf8');
  assert.ok(html.includes('sm:grid-cols-2'));
  assert.ok(!html.includes('sm:grid-cols-3'));
});

// Round 48, J4 C5: the two lead cards pin their test links to the bottom.
test('home lead cards are flex columns with the test link pinned to the bottom', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const classOf = (tag) => (tag.match(/class="([^"]*)"/) ?? [])[1]?.split(/\s+/) ?? [];
  for (const label of ['Read the acceptance test', 'Read the 200-send test']) {
    const textAt = html.indexOf(`>${label}</a>`);
    assert.ok(textAt > -1, `missing link: ${label}`);
    const aAt = html.lastIndexOf('<a ', textAt);
    const aClasses = classOf(html.slice(aAt, html.indexOf('>', aAt) + 1));
    assert.ok(aClasses.includes('mt-auto'), `${label}: no mt-auto`);
    assert.ok(aClasses.includes('self-start'), `${label}: no self-start`);
    assert.ok(!aClasses.includes('mt-4'), `${label}: still mt-4`);
    const divAt = html.lastIndexOf('<div ', aAt);
    const divClasses = classOf(html.slice(divAt, html.indexOf('>', divAt) + 1));
    for (const name of ['flex', 'flex-col', 'rounded-lg']) {
      assert.ok(divClasses.includes(name), `${label}: card has no ${name}`);
    }
  }
});
