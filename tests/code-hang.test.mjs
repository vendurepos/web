import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const decode = (html) =>
  html.replace(/<[^>]*>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Each docs code line: its opening tag's attributes and its decoded text.
function codeLines(page) {
  const html = readFileSync(`.next/server/app/docs/${page}.html`, 'utf8');
  return Array.from(html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g), ([, pre]) =>
    pre.split(/(?=<span class="line")/).slice(1).map((line) => ({
      attrs: /^<span class="line"([^>]*)>/.exec(line)[1],
      text: decode(line).replace(/\n$/, ''),
    }))
  );
}

test('wrapped code lines hang past their indent on phones only', () => {
  const css = readdirSync('.next/static', { recursive: true })
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join('.next/static', file), 'utf8'))
    .join('\n');
  const hang = (body) =>
    Array.from(body.matchAll(/([^{};]+)\{([^{}]*)\}/g)).filter(([, selector, declarations]) =>
      /\.line\b/.test(selector) && /text-indent\s*:\s*calc\(\s*-1\s*\*/.test(declarations));
  let [outside, inPhone, cursor] = ['', 0, 0];
  for (const match of css.matchAll(/@media([^{]*)\{/g)) {
    if (match.index < cursor) continue;
    let depth = 1;
    let end = match.index + match[0].length;
    for (; depth > 0 && end < css.length; end += 1) depth += { '{': 1, '}': -1 }[css[end]] ?? 0;
    outside += css.slice(cursor, match.index);
    if (/max-width:\s*639px/.test(match[1])) inPhone += hang(css.slice(match.index, end)).length;
    cursor = end;
  }
  assert.ok(inPhone > 0);
  outside += css.slice(cursor);
  assert.deepEqual(hang(outside), []);
});

test('code lines carry their own indent', () => {
  const line = (page, text) => codeLines(page).flat().find((l) => l.text === text);
  assert.match(line('quick-start',"  .catch(error => { console.error(error); process.exitCode = 1; });").attrs, /--indent:2ch/);
  assert.doesNotMatch(line('quick-start', 'runMigrations(config)').attrs, /--indent/);
  assert.match(line('plugin-setup', '    TallyPos1790648006022,').attrs, /--indent:4ch/);
});

test('code block text is unchanged', () => {
  const source = `import { generateMigration } from '@vendure/core';
import { config } from './vendure-config';

generateMigration(config, { name: 'AddVendurePos', outputDir: './src/migrations' })
  .catch(error => { console.error(error); process.exitCode = 1; });`;
  const blocks = codeLines('quick-start').map((lines) => lines.map((l) => l.text).join('\n'));
  assert.ok(blocks.includes(source));
});
