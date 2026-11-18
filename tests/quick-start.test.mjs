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

test('step 2 explains the Tally code names and names TallyUI, before its code', () => {
  const section = stepSection('to your existing Vendure config', 'Generate and run the migration');
  const sentence = section.indexOf('code names say Tally, not VendurePOS');
  assert.ok(sentence >= 0);
  assert.ok(section.indexOf('TallyUI commands', sentence) > sentence);
  assert.ok(sentence < section.indexOf('<pre'));
});

test('no built page spells it "Tally UI"', () => {
  const pages = readdirSync('.next/server/app', { recursive: true }).filter((file) => file.endsWith('.html'));
  assert.ok(pages.some((file) => file.startsWith('docs')));
  for (const file of pages) {
    assert.ok(!readFileSync(join('.next/server/app', file), 'utf8').includes('Tally UI'), file);
  }
});

test('step 3 leads with one path and names the other ways after it, in a note', () => {
  const section = stepSection('Generate and run the migration', 'Enable bearer authentication');
  const lastCode = section.lastIndexOf('<pre');
  assert.ok(lastCode >= 0 && section.indexOf('runMigrations', lastCode) > lastCode);
  const mainPathEnd = section.indexOf('</pre>', lastCode);
  const note = section.indexOf('Other ways to run the migration');
  assert.ok(note > mainPathEnd);
  for (const phrase of ['vendure migrate', 'bundled migrations']) {
    const first = section.indexOf(phrase);
    assert.ok(first > note, phrase);
  }
  assert.ok(section.indexOf('href="/docs/plugin-setup#configure-the-plugin-and-migrations"') > note);
  const setup = readFileSync('.next/server/app/docs/plugin-setup.html', 'utf8');
  assert.ok(setup.includes('id="configure-the-plugin-and-migrations"'));
});

test('step 7 leads with its actions', () => {
  const section = stepSection('Prepare the channel and stock, then restart Vendure', 'Sign in and make a sale');
  const list = section.match(/<ul\b[^>]*>((?:(?!<\/ul>)[\s\S])*)<\/ul>/);
  assert.ok(list);
  const items = Array.from(list[1].matchAll(/<li\b[^>]*>((?:(?!<\/li>)[\s\S])*)<\/li>/g));
  assert.equal(items.length, 3);
  assert.ok(items[0][1].includes('Assign the products'));
  assert.ok(section.indexOf('How POS sales take stock.') > list.index + list[0].length);
});

test('step 8c links how to add the barcode field', () => {
  const section = stepSection('Sign in and make a sale', 'Troubleshoot');
  const items = Array.from(section.matchAll(/<li\b[^>]*>((?:(?!<\/li>)[\s\S])*)<\/li>/g));
  assert.ok(items[2][1].includes('href="/docs/connect-a-till#enter-your-store-details"'));
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

test("step 4 names the plugin 0.3.0 till permissions and ReadOrder; the device-key section names ReadOrder", () => {
  // Round 17, J3 C3: vendurepos/app@2d3699e (plugin-v0.3.0) src/config/pos-till-role.ts:6-8 has no ReadOrder.
  const step4 = stepSection('Enable bearer authentication', 'Allow the POS origin through CORS');
  for (const permission of ['TallyPosSell', 'ReadCatalog', 'ReadSettings', 'ReadCustomer', 'CreateCustomer', 'ReadOrder']) {
    assert.ok(step4.includes(permission), permission);
  }
  const start = html.search(/<h2\b[^>]*>(?:(?!<\/h2>)[\s\S])*Optional: a device key for each till/);
  assert.ok(start >= 0);
  const end = html.indexOf('<h2', start + 3);
  assert.ok(html.slice(start, end < 0 ? undefined : end).includes('ReadOrder'));
});
