import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

test('hero explains what Try with your store needs', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const note = html.indexOf('Your own store needs the plugin on your Vendure server first');
  const tryStore = html.indexOf('Try with your store</a>');
  const heading = html.indexOf('What it does today</h2>');
  assert.ok(note !== -1);
  assert.ok(tryStore !== -1 && note > tryStore);
  assert.ok(heading !== -1 && note < heading);
});

test('hero shows the till, light and dark', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const tryStore = html.indexOf('Try with your store</a>');
  const heading = html.indexOf('What it does today</h2>');
  const img = html.search(/<img[^>]*\salt="The VendurePOS till mid-sale/);
  assert.ok(tryStore !== -1);
  assert.ok(img !== -1 && img > tryStore);
  assert.ok(heading !== -1 && img < heading);
  for (const file of ['sale-light', 'sale-dark', 'sale-phone-light', 'sale-phone-dark']) {
    assert.ok(html.includes(`${file}.png`), file);
    assert.ok(existsSync(`public/till/${file}.png`), file);
  }
});

test('hero serves the phone till capture below 640px', () => {
  // Round 11, C6: art direction, one <source media> per scheme pointing at the phone capture.
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const sources = html.match(/<source[^>]*>/g) ?? [];
  for (const scheme of ['light', 'dark']) {
    assert.ok(sources.some((s) => s.includes('media="(max-width: 639px)"') && s.includes(`sale-phone-${scheme}.png`)), scheme);
  }
});

test('phone hero capture is under one phone screen tall', () => {
  // Round 12, C6: captured at 390x664 CSS px, DPR 2, so the cart has no empty band; the <source> carries its height.
  const sources = readFileSync(join('.next/server/app', 'index.html'), 'utf8').match(/<source[^>]*>/g) ?? [];
  for (const scheme of ['light', 'dark']) {
    const png = readFileSync(`public/till/sale-phone-${scheme}.png`);
    const [width, height] = [png.readUInt32BE(16), png.readUInt32BE(20)];
    assert.ok(width === 780 && height <= 1400, `${scheme} ${width}x${height}`);
    assert.ok(sources.some((s) => s.includes(`sale-phone-${scheme}.png`) && s.includes(`height="${height}"`)), scheme);
  }
});

test('hero lede links Vendure to vendure.io', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const h1 = html.indexOf('<h1');
  const figure = html.indexOf('<figure');
  assert.ok(h1 !== -1 && figure > h1);
  const hero = html.slice(h1, figure);
  assert.match(hero, /<a[^>]*\shref="https:\/\/vendure\.io"[^>]*>Vendure<\/a>/);
  const text = hero.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '');
  assert.ok(text.includes('signs in to your own Vendure store'));
  // Round 15, C1: the hero says what Vendure is, in its own docs' terms (docs.vendure.io).
  assert.ok(text.includes('your own Vendure store (Vendure is an open-source headless commerce framework).'));
});
