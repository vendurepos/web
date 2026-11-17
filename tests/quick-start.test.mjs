import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
