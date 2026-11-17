import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

test('inline code in docs tables can wrap', () => {
  const stylesheets = readdirSync('.next/static', { recursive: true })
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join('.next/static', file), 'utf8'));

  assert.ok(stylesheets.some((css) =>
    Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g)).some(([, selector, declarations]) =>
      /\btable\b/.test(selector) && /\bcode\b/.test(selector) &&
      /(?:^|;)\s*overflow-wrap\s*:\s*anywhere\s*(?:;|$)/.test(declarations)
    )
  ));
});
