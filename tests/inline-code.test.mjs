import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const html = readdirSync('.next/server/app/docs')
  .filter((file) => file.endsWith('.html'))
  .map((file) => readFileSync(join('.next/server/app/docs', file), 'utf8'))
  .join('\n');

test('short inline code stays on one line', () => {
  assert.match(html, /<code[^>]*data-nowrap=""[^>]*>tally-in-store<\/code>/);
  assert.match(html, /<code[^>]*data-nowrap=""[^>]*>vendurepos-pos-till<\/code>/);
});

test('only short prose code is marked', () => {
  for (const [, inner] of html.matchAll(/<code\b[^>]*data-nowrap[^>]*>([\s\S]*?)<\/code>/g)) {
    const text = inner.replace(/<[^>]*>/g, '');
    assert.ok(text.length <= 24 || (text.length <= 36 && text.includes('/') && !/\s/.test(text)));
  }
  for (const [block] of html.matchAll(/<pre\b[^>]*>[\s\S]*?<\/pre>/g)) {
    assert.doesNotMatch(block, /data-nowrap/);
  }
});

test('wrapped inline code keeps closed ends', () => {
  const stylesheets = readdirSync('.next/static', { recursive: true })
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join('.next/static', file), 'utf8'));
  const rules = stylesheets.flatMap((css) => Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g)));
  assert.ok(rules.some(([, , declarations]) =>
    /(?:^|;)\s*box-decoration-break\s*:\s*clone\s*(?:;|$)/.test(declarations)
  ));
  assert.ok(rules.some(([, selector, declarations]) =>
    selector.includes('data-nowrap') && /(?:^|;)\s*white-space\s*:\s*nowrap\s*(?:;|$)/.test(declarations)
  ));
});

test('short paths and URLs stay on one line (round 86, J4 C6)', () => {
  assert.match(html, /<code[^>]*data-nowrap=""[^>]*>packages\/vendure-plugin\/CHANGELOG\.md<\/code>/);
  assert.match(html, /<code[^>]*data-nowrap=""[^>]*>https:\/\/vendurepos\.vercel\.app<\/code>/);
});
