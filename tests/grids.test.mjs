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
