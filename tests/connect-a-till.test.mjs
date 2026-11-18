import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('.next/server/app/docs/connect-a-till.html', 'utf8');

// Visible text: tags dropped (Shiki splits code into spans), common entities decoded.
const decode = (s) =>
  s
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

test('connect a till: the pnpm section names its file, imports resolve and says how to check it', () => {
  // Round 18, J3 C3: the snippet left the config file and the path import to be inferred.
  const start = html.indexOf('id="make-the-key-button-available-in-a-pnpm-project"');
  const end = html.indexOf('id="fix-a-sign-in-problem"', start);
  assert.ok(start >= 0 && end > start);
  const text = decode(html.slice(start, end));
  for (const needle of [
    'vite.config.mts',
    "import { resolve } from 'path'",
    'nodeModulesRoot',
    'npx vite build',
    'New POS till key',
  ]) {
    assert.ok(text.includes(needle), needle);
  }
});
