import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { PAGE_DATE_FALLBACK } from '../lib/page-dates.ts';

const body = readFileSync('.next/server/app/sitemap.xml.body', 'utf8');
const blocks = [...body.matchAll(/<url>[\s\S]*?<\/url>/g)].map((match) => match[0]);
const lastmods = blocks.map((block) => block.match(/<lastmod>([^<]*)<\/lastmod>/)?.[1]);

test('every sitemap url has one lastmod', () => {
  assert.equal(blocks.length, 9);
  for (const block of blocks) {
    assert.equal([...block.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].length, 1);
  }
});

test('the lastmod values are not all equal', () => {
  assert.ok(new Set(lastmods).size > 1);
});

test('quick-start lastmod is its source file\'s last commit', () => {
  assert.equal(
    execFileSync('git', ['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim(),
    'false',
    'the sitemap test needs full git history',
  );
  const block = blocks.find((entry) => entry.includes('<loc>https://vendurepos.com/docs/quick-start</loc>'));
  assert.ok(block);
  const expected = execFileSync('git', ['log', '-1', '--format=%cI', '--', 'content/docs/quick-start.mdx'], { encoding: 'utf8' }).trim();
  assert.equal(block.match(/<lastmod>([^<]*)<\/lastmod>/)?.[1], expected);
});

test('the history fallback covers every page', () => {
  const docs = readdirSync('content/docs').filter((name) => name.endsWith('.mdx'));
  const files = ['app/(home)/page.tsx', ...docs.map((name) => `content/docs/${name}`)];
  assert.deepEqual(Object.keys(PAGE_DATE_FALLBACK).sort(), files.sort());
});
