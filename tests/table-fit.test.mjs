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
  assert.match(html, /taxOptions\.<wbr\s*\/?\s*>order<wbr\s*\/?\s*>Tax<wbr\s*\/?\s*>Calculation<wbr\s*\/?\s*>Strategy/);
  for (const [block] of html.matchAll(/<pre\b[^>]*>[\s\S]*?<\/pre>/g)) {
    assert.doesNotMatch(block, /<wbr\b/);
  }
});
