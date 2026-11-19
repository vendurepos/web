import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

test('home demo table carries data-stack and a label on every cell', () => {
  const html = readFileSync('.next/server/app/index.html', 'utf8');
  const after = html.slice(html.indexOf('Live demo or your own store'));
  const table = after.match(/<table\b[^>]*>[\s\S]*?<\/table>/)?.[0];
  assert.ok(table, 'table after "Live demo or your own store"');
  assert.match(table, /^<table\b[^>]*\sdata-stack=""/);
  const cells = Array.from(table.matchAll(/<td\b[^>]*>/g), ([cell]) => cell);
  assert.ok(cells.length > 0);
  const labels = cells.map((cell) => cell.match(/\sdata-label="([^"]*)"/)?.[1]);
  assert.ok(labels.every(Boolean), 'every <td> has a data-label');
  assert.deepEqual([...new Set(labels)].sort(), ['Live demo', 'Your Vendure store']);
});

// The built CSS, split into the home table's (non-`.prose`) data-stack rules in the phone @media block and outside
// every @media block.
function homeTableRules() {
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
  // This table's rules: data-stack selectors that are not the docs `.prose` ones.
  const homeRules = (text) =>
    Array.from(text.matchAll(/([^{};]+)\{([^{}]*)\}/g)).filter(([, selector]) =>
      selector.split(',').some((part) => /data-stack/.test(part) && !/^\s*\.prose\b/.test(part))
    );
  const phone = media
    .filter(({ condition }) => /max-width\s*:\s*639px|max-width\s*:\s*39\.9375rem|width\s*<\s*640px/.test(condition))
    .flatMap(({ body }) => homeRules(body));
  return { phone, outside: homeRules(outside) };
}

test('home demo table stacks only on phones', () => {
  const { phone, outside } = homeTableRules();
  assert.ok(phone.some(([, selector, declarations]) =>
    /\btr\b/.test(selector) && /display\s*:\s*block/.test(declarations)
  ), 'rows are display:block on phones');
  assert.ok(phone.some(([, selector, declarations]) =>
    /::?before/.test(selector) && /attr\(data-label\)/.test(declarations)
  ), 'a ::before rule shows attr(data-label)');
  assert.ok(!outside.some(([, , declarations]) => /display\s*:\s*block/.test(declarations)));
});

test('home demo table row titles lead on phones', () => {
  // Round 37, J4 C6: the stacked labels were bold and the row titles regular.
  const { phone, outside } = homeTableRules();
  assert.ok(phone.some(([, selector, declarations]) =>
    /\btbody\b/.test(selector) && /\bth\b/.test(selector) && !/\bthead\b/.test(selector) &&
    /font-weight\s*:\s*600/.test(declarations) && /color\s*:\s*var\(--color-fd-foreground\)/.test(declarations)
  ), 'a tbody th rule sets font-weight:600 and the foreground colour');
  const before = phone.filter(([selector]) => /::?before/.test(selector));
  assert.ok(before.length > 0, 'a ::before rule');
  for (const [, , declarations] of before) {
    assert.match(declarations, /font-weight\s*:\s*(400|normal)/);
    assert.match(declarations, /color\s*:\s*var\(--color-fd-muted-foreground\)/);
    assert.doesNotMatch(declarations, /color\s*:\s*var\(--color-fd-foreground\)/);
  }
  assert.ok(!outside.some(([, , declarations]) => /font-weight/.test(declarations)), 'no font-weight outside @media');
});
