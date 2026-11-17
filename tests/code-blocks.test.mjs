import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('.next/server/app/docs/quick-start.html', 'utf8');

test('every code block has a header caption', () => {
  const figures = Array.from(html.matchAll(/<figure\b[^>]*class="[^"]*\bshiki\b[^"]*"[^>]*>([\s\S]*?)<\/figure>/g));
  assert.ok(figures.length > 0);
  let captions = 0;
  for (const [, body] of figures) {
    const count = Array.from(body.matchAll(/<figcaption\b/g)).length;
    assert.equal(count, 1);
    captions += count;
  }
  assert.equal(captions, figures.length);
});

test('code block headers label TypeScript and terminal commands', () => {
  assert.ok(html.includes('>TypeScript</figcaption>'));
  assert.ok(html.includes('>Terminal</figcaption>'));
});

test('code blocks do not use floating copy actions', () => {
  assert.ok(!html.includes('absolute top-3 right-2'));
});
