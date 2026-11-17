import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const html = () => readFileSync(join('.next/server/app', 'index.html'), 'utf8');

test('home table says the demo sends anonymous events, not that nothing leaves the page', () => {
  const page = html();
  assert.ok(!page.includes('nothing leaves the page'));
  assert.ok(page.includes('ph.wcpos.com'));
});

test('home table has a till refund row whose store cell needs the release after 0.3.0', () => {
  const rows = html().match(/<tr[\s>][\s\S]*?<\/tr>/g) ?? [];
  const row = rows.find((r) => r.includes('Refund a sale at the till'));
  assert.ok(row, 'no row for Refund a sale at the till');
  assert.ok(row.includes('after 0.3.0'));
});
