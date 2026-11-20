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
  // Round 14 (C6): every body cell carries its column header's text as data-label.
  const plain = (cell) => cell.replace(/<[^>]*>/g, '').trim();
  const headers = Array.from(stacked[0].match(/<thead\b[\s\S]*?<\/thead>/)[0].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g),
    ([, cell]) => plain(cell));
  assert.deepEqual(headers, ['Channel pricing', 'taxOptions.orderTaxCalculationStrategy']);
  const rows = Array.from(stacked[0].match(/<tbody\b[\s\S]*?<\/tbody>/)[0].matchAll(/<tr\b[\s\S]*?<\/tr>/g), ([row]) => row);
  assert.ok(rows.length > 0);
  for (const row of rows) {
    const labels = Array.from(row.matchAll(/<td\b([^>]*)>/g), ([, attrs]) => attrs.match(/\sdata-label="([^"]*)"/)?.[1]);
    assert.deepEqual(labels, headers);
  }
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
  // Round 14 (C6): on phones the docs header row is hidden visually and each cell shows its column label.
  const proseRules = media
    .filter(({ condition }) => /max-width\s*:\s*639px|max-width\s*:\s*39\.9375rem|width\s*<\s*640px/.test(condition))
    .flatMap(({ body }) => Array.from(body.matchAll(/([^{};]+)\{([^{}]*)\}/g)))
    .filter(([, selector]) => selector.split(',').some((part) => /^\s*\.prose\b/.test(part) && /data-stack/.test(part)));
  assert.ok(proseRules.some(([, selector, declarations]) =>
    /\bthead\s*$/.test(selector) && /position\s*:\s*absolute/.test(declarations)
      && /clip-path\s*:\s*inset\(50%\)/.test(declarations)
  ), 'docs stacked thead is visually hidden on phones');
  assert.ok(proseRules.some(([, selector, declarations]) =>
    /td\[data-label\]::?before/.test(selector) && /attr\(data-label\)/.test(declarations)
  ), 'docs stacked cells show attr(data-label) through ::before');
});

test('a code column label is a mono label, not a chip, on phones', () => {
  // Round 56 (J4 C6): the code header's phone label keeps the mono font; round 57 (J4 C6): no chip, and labels end in a colon.
  const html = readFileSync('.next/server/app/docs/quick-start.html', 'utf8');
  const [table] = Array.from(html.matchAll(/<table\b[^>]*\sdata-stack=""[\s\S]*?<\/table>/g), ([t]) => t);
  const rows = Array.from(table.match(/<tbody\b[\s\S]*?<\/tbody>/)[0].matchAll(/<tr\b[\s\S]*?<\/tr>/g), ([row]) => row);
  assert.ok(rows.length > 0);
  for (const row of rows) {
    const cells = Array.from(row.matchAll(/<td\b([^>]*)>/g), ([, attrs]) => attrs);
    const cell = (label) => cells.find((attrs) => attrs.includes(` data-label="${label}"`));
    assert.match(cell('taxOptions.orderTaxCalculationStrategy'), /\sdata-label-code=""/);
    assert.doesNotMatch(cell('Channel pricing'), /data-label-code/);
  }
  const css = readdirSync('.next/static', { recursive: true }).filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join('.next/static', file), 'utf8')).join('\n');
  const phone = [];
  for (const match of css.matchAll(/@media([^{]*)\{/g)) {
    let depth = 1;
    let end = match.index + match[0].length;
    for (; depth > 0 && end < css.length; end += 1) depth += { '{': 1, '}': -1 }[css[end]] ?? 0;
    if (/max-width\s*:\s*639px|max-width\s*:\s*39\.9375rem|width\s*<\s*640px/.test(match[1]))
      phone.push(...css.slice(match.index + match[0].length, end - 1).matchAll(/([^{};]+)\{([^{}]*)\}/g));
  }
  const codeLabels = phone.filter(([, selector]) =>
    selector.split(',').some((part) => /\.prose\b.*data-stack.*td\[data-label-code\]::?before/.test(part)));
  assert.ok(codeLabels.length > 0 && codeLabels.every(([, , declarations]) =>
    /(?:^|;)\s*font-family\s*:/.test(declarations)
      && !/(?:^|;)\s*(?:background(?:-color)?|border|border-radius|padding)\s*:/.test(declarations)
  ), 'docs stacked code labels have a mono font and no chip box on phones');
  assert.ok(phone.some(([, selector, declarations]) =>
    selector.split(',').some((part) => /\.prose\b.*data-stack.*td\[data-label\]::?before/.test(part))
      && /content\s*:\s*attr\(data-label\)\s*["']:["']/.test(declarations)
  ), 'docs stacked labels end in a colon on phones');
});
