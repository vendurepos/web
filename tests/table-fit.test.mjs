import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

test('inline code in docs tables wraps only as a last resort', () => {
  const stylesheets = readdirSync('.next/static', { recursive: true })
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join('.next/static', file), 'utf8'));

  const tableCodeRules = stylesheets.flatMap((css) =>
    Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g)).filter(([, selector]) =>
      /\btable\b/.test(selector) && /\bcode\b/.test(selector)
    )
  );
  assert.ok(tableCodeRules.some(([, , declarations]) =>
    /(?:^|;)\s*overflow-wrap\s*:\s*break-word\s*(?:;|$)/.test(declarations)
  ));
  assert.ok(!tableCodeRules.some(([, , declarations]) =>
    /(?:^|;)\s*overflow-wrap\s*:\s*anywhere\s*(?:;|$)/.test(declarations)
  ));
});

test('table code breaks at word boundaries', () => {
  const html = readFileSync('.next/server/app/docs/quick-start.html', 'utf8');
  assert.match(html, /tax<wbr\s*\/?\s*>Options\.<wbr\s*\/?\s*>order<wbr\s*\/?\s*>Tax<wbr\s*\/?\s*>Calculation<wbr\s*\/?\s*>Strategy/);
  for (const [block] of html.matchAll(/<pre\b[^>]*>[\s\S]*?<\/pre>/g)) {
    assert.doesNotMatch(block, /<wbr\b/);
  }
});

test('long-code tables stack on phones', () => {
  const html = readFileSync('.next/server/app/docs/quick-start.html', 'utf8');
  const stacked = Array.from(html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/g), ([table]) => table)
    .filter((table) => /^<table\b[^>]*\sdata-stack=""/.test(table));
  assert.equal(stacked.length, 1);
  assert.match(stacked[0].replace(/<wbr\s*\/?\s*>/g, ''), /OrderLevelTax/);
  const others = readdirSync('.next/server/app/docs').filter((f) => f.endsWith('.html') && f !== 'quick-start.html');
  assert.ok(others.length > 0);
  for (const file of others) {
    assert.doesNotMatch(readFileSync(join('.next/server/app/docs', file), 'utf8'), /data-stack/, file);
  }
});

test('stack rule is phone-only', () => {
  const css = readdirSync('.next/static', { recursive: true })
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join('.next/static', file), 'utf8'))
    .join('\n');
  // Split the CSS into brace-matched @media blocks and everything outside them.
  const media = [];
  let outside = '';
  let cursor = 0;
  for (const match of css.matchAll(/@media([^{]*)\{/g)) {
    if (match.index < cursor) continue;
    let depth = 1;
    let end = match.index + match[0].length;
    for (; depth > 0 && end < css.length; end += 1) depth += { '{': 1, '}': -1 }[css[end]] ?? 0;
    outside += css.slice(cursor, match.index);
    media.push({ condition: match[1], body: css.slice(match.index + match[0].length, end - 1) });
    cursor = end;
  }
  outside += css.slice(cursor);
  assert.ok(media.some(({ condition, body }) =>
    /max-width/.test(condition) && /data-stack/.test(body) && /display\s*:\s*block/.test(body)
  ));
  const selectors = Array.from(outside.matchAll(/([^{};]+)\{/g), ([, selector]) => selector);
  assert.ok(!selectors.some((selector) => /data-stack/.test(selector)));
});
