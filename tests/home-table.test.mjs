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

test('home table links "anonymous usage events" to where the data goes, words unchanged', () => {
  const rows = html().match(/<tr[\s>][\s\S]*?<\/tr>/g) ?? [];
  const row = rows.find((r) => r.includes('ph.wcpos.com'));
  assert.ok(row, 'no row mentioning ph.wcpos.com');
  const link = row.match(/<a\b[^>]*\shref="\/docs\/connect-a-till#where-your-data-goes"[^>]*>([\s\S]*?)<\/a>/);
  assert.ok(link, 'no link to /docs/connect-a-till#where-your-data-goes');
  assert.equal(link[1].replace(/<[^>]*>/g, ''), 'anonymous usage events');
  const cell = row.match(/<td\b[^>]*>[\s\S]*?<\/td>/g)?.find((c) => c.includes('ph.wcpos.com'));
  assert.ok(cell.replace(/<[^>]*>/g, '').includes('All it sends is anonymous usage events to ph.wcpos.com, with no cookie'));
});

test('home table fixes its columns from 640px up so row labels fit on one line', () => {
  const page = html();
  const table = page.slice(page.indexOf('Live demo or your own store')).match(/<table\b[^>]*>[\s\S]*?<\/thead>/)?.[0];
  assert.ok(table, 'table after "Live demo or your own store"');
  const classes = (tag) => tag.match(/\sclass="([^"]*)"/)?.[1].split(/\s+/) ?? [];
  assert.ok(classes(table.match(/^<table\b[^>]*>/)[0]).includes('sm:table-fixed'));
  const widths = Array.from(table.matchAll(/<th\b[^>]*>/g), ([th]) => classes(th).filter((c) => /(^|:)w-/.test(c)));
  assert.deepEqual(widths, [['sm:w-[34%]'], ['sm:w-[22%]'], []]);
});
