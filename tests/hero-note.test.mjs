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
  assert.ok(html.includes('sale-light.png'));
  assert.ok(html.includes('sale-dark.png'));
  assert.ok(existsSync('public/till/sale-light.png'));
  assert.ok(existsSync('public/till/sale-dark.png'));
});
