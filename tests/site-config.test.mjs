import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('every route sends the security headers', () => {
  const manifest = JSON.parse(readFileSync(join('.next', 'routes-manifest.json'), 'utf8'));
  const entry = manifest.headers.find((item) => item.source === '/:path*');
  assert.ok(entry);
  for (const [key, value] of [
    ['Strict-Transport-Security', 'max-age=63072000'],
    ['X-Content-Type-Options', 'nosniff'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['X-Frame-Options', 'DENY'],
    ['Content-Security-Policy', "frame-ancestors 'none'"],
  ]) {
    assert.ok(entry.headers.some((header) => header.key === key && header.value === value), key);
  }
});

test('docs pages carry og:url, og:site_name and og:type', () => {
  const html = readFileSync(join('.next/server/app', 'docs/quick-start.html'), 'utf8');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"\s*\/?>/);
  const url = html.match(/<meta property="og:url" content="([^"]+)"\s*\/?>/);
  assert.ok(canonical);
  assert.ok(url);
  assert.equal(url[1], canonical[1]);
  assert.equal(url[1], 'https://vendurepos.com/docs/quick-start');
  assert.equal(html.match(/<meta property="og:site_name" content="([^"]+)"\s*\/?>/)?.[1], 'VendurePOS');
  assert.equal(html.match(/<meta property="og:type" content="([^"]+)"\s*\/?>/)?.[1], 'article');
  const image = html.match(/<meta property="og:image" content="([^"]+)"\s*\/?>/);
  assert.ok(image);
  assert.match(image[1], /^https:\/\/vendurepos\.com\/og\/docs\/quick-start\//);
});
