import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('home lists the features added since the first release', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  for (const title of [
    'Park a sale, resume it later',
    'Change a line price',
    'Customers at the till',
    'Line and order discounts',
  ]) {
    assert.ok(html.includes(title), title);
  }
});

test('home has the demo parity table', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  assert.ok(html.includes('Live demo or your own store'));
  assert.ok(html.includes('>Live demo</th>'));
  assert.ok(html.includes('>Your Vendure store</th>'));
  assert.equal(Array.from(html.matchAll(/<th scope="col"/g)).length, 3);
  assert.equal(Array.from(html.matchAll(/<th scope="row"/g)).length, 6);
});

test('home claims no split tender', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  // vendurepos/app README lists split tender under "Known limitations".
  assert.doesNotMatch(html, /split (?:tender|payment)/i);
});

test('docs index and quick start link the live demo', () => {
  for (const file of ['docs.html', 'docs/quick-start.html']) {
    const html = readFileSync(join('.next/server/app', file), 'utf8');
    // The nav links the demo on every docs page, so look for the body's own lowercase "live demo" link.
    assert.match(html, /<a href="https:\/\/demo\.vendurepos\.com\/demo"[^>]*>live demo<\/a>/, file);
  }
  const site = readFileSync('lib/site.ts', 'utf8');
  assert.ok(site.includes("DEMO_URL = 'https://demo.vendurepos.com/demo'"));
});

test('every home feature and demo row cites a vendurepos/app test', () => {
  const source = readFileSync('app/(home)/page.tsx', 'utf8');
  let previous = '';
  let count = 0;
  for (const line of source.split('\n')) {
    if (/^\s*(?:title|capability): /.test(line)) {
      assert.match(previous, /^\s*\/\/.*\.(?:spec|test|e2e)\.ts\b/, line);
      count += 1;
    }
    if (line.trim()) previous = line;
  }
  assert.ok(count >= 16, `Expected at least 16 feature and demo rows, found ${count}`);
});

test('hero puts the live demo first, as the primary button', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const demo = '<a href="https://demo.vendurepos.com/demo" class="rounded-md bg-fd-primary px-6 py-3 text-fd-primary-foreground hover:bg-fd-primary/90">Live demo</a>';
  const quickStart = '<a class="rounded-md border border-fd-border px-6 py-3 hover:bg-fd-accent" href="/docs/quick-start">Quick start</a>';
  const tryStore = '<a href="https://app.vendurepos.com" class="rounded-md border border-fd-border px-6 py-3 hover:bg-fd-accent">Try with your store</a>';
  assert.ok(html.includes(demo));
  assert.ok(html.includes(quickStart));
  assert.ok(html.includes(tryStore));
  assert.ok(html.indexOf(demo) < html.indexOf(quickStart));
  assert.ok(html.indexOf(quickStart) < html.indexOf(tryStore));
  assert.equal(Array.from(html.matchAll(/class="rounded-md bg-fd-primary/g)).length, 1);
});
