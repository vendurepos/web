import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sitemapSeeds } from '../scripts/sitemap-seeds.mjs';

const fixture = `<urlset>
  <url><loc>https://vendurepos.com</loc></url>
  <url><loc>https://vendurepos.com/docs</loc></url>
  <url><loc>https://vendurepos.com/docs/quick-start</loc></url>
</urlset>`;

test('seeds the root and every sitemap page on the local server', () => {
  assert.deepEqual(sitemapSeeds(fixture), [
    { source: '/', url: 'http://localhost:3000/' },
    { source: 'sitemap', url: 'http://localhost:3000/' },
    { source: 'sitemap', url: 'http://localhost:3000/docs' },
    { source: 'sitemap', url: 'http://localhost:3000/docs/quick-start' },
  ]);
});

test('rejects an empty sitemap or input without a urlset', () => {
  assert.throws(() => sitemapSeeds('<urlset></urlset>'), /sitemap/);
  assert.throws(() => sitemapSeeds('<html></html>'), /sitemap/);
});

test('CLI rejects an empty sitemap and prints fixture seeds with diagnostics', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'sitemap-seeds-'));
  t.after(() => rmSync(directory, { recursive: true }));
  const file = join(directory, 'sitemap.xml');
  writeFileSync(file, '<urlset></urlset>');
  const invalid = spawnSync(process.execPath, ['scripts/sitemap-seeds.mjs', file], { encoding: 'utf8' });
  assert.notEqual(invalid.status, 0);

  writeFileSync(file, fixture);
  const valid = spawnSync(process.execPath, ['scripts/sitemap-seeds.mjs', file], { encoding: 'utf8' });
  assert.equal(valid.status, 0);
  assert.equal(valid.stdout.trim().split('\n').length, 4);
  assert.ok(valid.stderr.includes('seed (/): http://localhost:3000/'));
  assert.ok(valid.stderr.includes('seed (sitemap): http://localhost:3000/docs/quick-start'));
});
