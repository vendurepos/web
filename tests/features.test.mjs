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
  assert.equal(Array.from(html.matchAll(/<th scope="row"/g)).length, 7);
});

test('home names split payment', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  // vendurepos/app 1404f42 apps/pos/e2e/sign-in.spec.ts: a split sale, part cash and part card.
  const start = html.indexOf('Cash, card and receipts');
  assert.ok(start >= 0);
  const card = html.slice(start, html.indexOf('</p>', start));
  assert.match(card, /split/i);
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
  assert.ok(html.includes(demo));
  assert.ok(html.includes(quickStart));
  assert.ok(html.indexOf(demo) < html.indexOf(quickStart));
  assert.equal(Array.from(html.matchAll(/class="rounded-md bg-fd-primary/g)).length, 1);
});

test('hero has two buttons, no GitHub link, and the note links the quick start and the app', () => {
  // Round 18, C1: Try with your store moves into the note under the buttons; GitHub stays in the header.
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const h1 = html.indexOf('<h1');
  const figure = html.indexOf('<figure');
  assert.ok(h1 !== -1 && figure > h1);
  const hero = html.slice(h1, figure);
  const buttons = Array.from(hero.matchAll(/<a\b[^>]*\bclass="[^"]*\bpx-6 py-3\b[^"]*"[^>]*>([^<]*)<\/a>/g));
  assert.deepEqual(buttons.map((m) => m[1]), ['Live demo', 'Quick start']);
  assert.match(buttons[0][0], /\bbg-fd-primary\b/);
  assert.ok(!hero.includes('href="https://github.com/vendurepos/app"'));
  const noteAt = hero.indexOf('Your own store needs the plugin on your Vendure server first');
  assert.ok(noteAt > hero.indexOf('Quick start</a>'));
  const note = hero.slice(noteAt);
  assert.match(note, /<a[^>]*\shref="\/docs\/quick-start"[^>]*>quick start<\/a>/);
  assert.match(note, /<a[^>]*\shref="https:\/\/app\.vendurepos\.com"[^>]*>try the till with your store<\/a>/);
});

test('the two proof claims link their tests', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  assert.match(html, /<a href="https:\/\/github\.com\/vendurepos\/app\/blob\/main\/apps\/pos\/e2e\/offline\.spec\.ts"[^>]*>Read the acceptance test<\/a>/);
  assert.match(html, /<a href="https:\/\/github\.com\/vendurepos\/app\/blob\/main\/packages\/vendure-plugin\/test\/replay\.e2e\.ts"[^>]*>Read the 200-send test<\/a>/);
  assert.equal(Array.from(html.matchAll(/<a\b[^>]*\bhref="https:\/\/github\.com\/vendurepos\/app\/blob\/main\//g)).length, 2);
});

test('before you start gates refunds on the plugin and names coupon codes as not yet', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  // plugin-v0.3.0 (2d3699e) info.controller.ts:29 (no order.refund); vendurepos/app 1404f42 apps/pos/lib/discount-total-matrix.test.ts:171-178.
  const heading = html.indexOf('Before you start');
  const end = html.indexOf('href="/docs/limitations"', heading);
  assert.ok(heading >= 0 && end > heading);
  const block = html.slice(heading, end);
  assert.match(block, /Coupon codes are not supported yet/);
  assert.match(block, /On plugin 0\.3\.0,\s+refunds go through the Vendure Dashboard; the live demo also refunds at the till\./);
  assert.doesNotMatch(block, /Not yet: refunds/i);
});

test('before you start links the staff guide, At the till', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const heading = html.indexOf('Before you start');
  const end = html.indexOf('</section>', heading);
  assert.ok(heading >= 0 && end > heading);
  assert.match(html.slice(heading, end), /href="\/docs\/at-the-till"[^>]*>At the till</);
});
