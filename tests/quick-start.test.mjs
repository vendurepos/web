import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const html = readFileSync('.next/server/app/docs/quick-start.html', 'utf8');

test('quick start omits the internal ADR tag', () => {
  assert.doesNotMatch(html, /ADR-?0*48/);
});

test('quick start links the setup warnings before a live sale', () => {
  assert.ok(html.includes('Before a sale on a live store'));
  assert.ok(html.includes('href="/docs/plugin-setup#set-up-email"'));
  assert.ok(html.includes('href="/docs/plugin-setup#check-your-own-code"'));
});

test('quick start includes the success checklist', () => {
  assert.ok(html.includes('Check it worked.'));
  assert.ok(html.includes('tallySaleAt'));
});

test('quick start keeps tax rounding as a level-two heading', () => {
  assert.match(html, /<h2\b[^>]*>(?:(?!<\/h2>)[\s\S])*Choose tax rounding for your pricing mode(?:(?!<\/h2>)[\s\S])*<\/h2>/);
});

test('step 3 names the runner', () => {
  assert.ok(html.includes('npx tsx src/generate-migration.ts'));
  assert.ok(html.includes('npx tsx src/run-migrations.ts'));
});

test('device key is optional and last', () => {
  const headings = Array.from(html.matchAll(/<h2\b[^>]*>((?:(?!<\/h2>)[\s\S])*)<\/h2>/g));
  const tax = headings.findIndex(([, inner]) => inner.includes('Choose tax rounding for your pricing mode'));
  const key = headings.findIndex(([, inner]) => inner.includes('Optional: a device key for each till'));
  assert.ok(tax >= 0);
  assert.ok(key > tax);
});

function stepSection(from, to) {
  const headings = Array.from(html.matchAll(/<h2\b[^>]*>((?:(?!<\/h2>)[\s\S])*)<\/h2>/g));
  const start = headings.find(([, inner]) => inner.includes(from));
  const end = headings.find(([, inner]) => inner.includes(to));
  assert.ok(start && end && end.index > start.index);
  return html.slice(start.index, end.index);
}

test('step 7 leads with its actions', () => {
  const section = stepSection('Prepare the channel and stock, then restart Vendure', 'Sign in and make a sale');
  const list = section.match(/<ul\b[^>]*>((?:(?!<\/ul>)[\s\S])*)<\/ul>/);
  assert.ok(list);
  const items = Array.from(list[1].matchAll(/<li\b[^>]*>((?:(?!<\/li>)[\s\S])*)<\/li>/g));
  assert.equal(items.length, 3);
  assert.ok(items[0][1].includes('Assign the products'));
  assert.ok(section.indexOf('How POS sales take stock.') > list.index + list[0].length);
});

test("step 8's list is lettered", () => {
  const section = stepSection('Sign in and make a sale', 'Troubleshoot');
  assert.match(section, /<div\b[^>]*class="[^"]*\bsteps-lettered\b[^"]*"[^>]*>\s*<ol\b/);
  const stylesheets = readdirSync('.next/static', { recursive: true })
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join('.next/static', file), 'utf8'));
  const rules = stylesheets.flatMap((css) => Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g)));
  assert.ok(rules.some(([, selector, declarations]) =>
    selector.includes('steps-lettered') && /(?:^|;)\s*list-style-type\s*:\s*lower-alpha\s*(?:;|$)/.test(declarations)
  ));
});
