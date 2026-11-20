import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_DESCRIPTION } from '../lib/site.ts';

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

test('the 404 page has its own description, not the home one', () => {
  const html = readFileSync(join('.next/server/app', '_not-found.html'), 'utf8');
  assert.ok(html.includes('<meta name="description" content="There is no page at this address."'));
  assert.ok(!html.includes(SITE_DESCRIPTION));
});

test('the 404 page lists every docs page in sidebar order (round 68, J4 C7)', () => {
  const html = readFileSync(join('.next/server/app', '_not-found.html'), 'utf8');
  const nav = html.match(/aria-label="Docs pages"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav);
  const links = [...nav.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([^<]*)<\/a>/g)]
    .map(([, href, text]) => [href, text]);
  assert.deepEqual(links, [
    ['/docs', 'Overview'],
    ['/docs/quick-start', 'Quick start'],
    ['/docs/plugin-setup', 'Plugin setup'],
    ['/docs/connect-a-till', 'Connect a till'],
    ['/docs/at-the-till', 'At the till'],
    ['/docs/notifications', 'Notifications'],
    ['/docs/troubleshooting', 'Troubleshooting'],
    ['/docs/limitations', 'Limitations'],
    ['/docs/changelog', 'Changelog'],
  ]);
});
