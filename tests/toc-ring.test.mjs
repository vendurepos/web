import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Round 10: judges read fumadocs' progress ring in the phone "On this page" bar as a loading spinner (app/global.css).
test('the phone TOC bar hides its progress ring', () => {
  const css = readdirSync('.next/static', { recursive: true })
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join('.next/static', file), 'utf8'))
    .join('\n');
  assert.match(css, /\[data-toc-popover-trigger\]>svg\[role=["']?progressbar["']?\]\{display:none\}/);
  const html = readFileSync('.next/server/app/docs/quick-start.html', 'utf8');
  assert.match(html, /data-toc-popover-trigger=""[^>]*>\s*<svg role="progressbar"/);
});
