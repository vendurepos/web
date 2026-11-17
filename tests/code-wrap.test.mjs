import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Split the built CSS into brace-matched @media blocks and everything outside them.
function splitMedia() {
  const css = readdirSync('.next/static', { recursive: true })
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join('.next/static', file), 'utf8'))
    .join('\n');
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
  return { media, outside };
}

const preWrapRules = (css) =>
  Array.from(css.matchAll(/([^{};]+)\{([^{}]*)\}/g)).filter(([, selector, declarations]) =>
    /(?:^|[\s>+~,(])pre(?![\w-])/.test(selector) && /white-space\s*:\s*pre-wrap/.test(declarations)
  );

test('code blocks wrap on phones', () => {
  const { media } = splitMedia();
  assert.ok(media.some(({ condition, body }) => /max-width/.test(condition) && preWrapRules(body).length > 0));
});

test('code blocks keep their lines on desktop', () => {
  const { outside } = splitMedia();
  assert.deepEqual(preWrapRules(outside).map(([, selector]) => selector.trim()), []);
});
