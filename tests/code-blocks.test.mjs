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

// Round 48, J5: the runMigrations snippet on Plugin setup imports config.
test('plugin setup runMigrations snippet imports config', () => {
  const page = readFileSync('.next/server/app/docs/plugin-setup.html', 'utf8');
  const blocks = Array.from(page.matchAll(/<figure\b[^>]*class="[^"]*\bshiki\b[^"]*"[^>]*>([\s\S]*?)<\/figure>/g)).map(
    ([, body]) => body.replace(/<[^>]+>/g, '').replace(/&#x27;|&#39;/g, "'"),
  );
  const block = blocks.find(text => text.includes('runMigrations(config)'));
  assert.ok(block);
  assert.ok(block.includes("import { config } from './vendure-config';"));
});
