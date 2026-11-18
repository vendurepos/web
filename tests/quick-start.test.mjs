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

// Round 20, J4 C6: steps 6 and 7 fold their explanations into one closed block each; the text stays in the HTML.
function closedBlock(section, title) {
  const blocks = Array.from(section.matchAll(/<details\b([^>]*)>((?:(?!<\/details>)[\s\S])*)<\/details>/g));
  assert.equal(blocks.length, 1);
  const [block, attributes, inner] = blocks[0];
  assert.doesNotMatch(attributes, /\sopen\b/);
  const summary = inner.match(/<summary\b[^>]*>((?:(?!<\/summary>)[\s\S])*)<\/summary>/);
  assert.ok(summary);
  assert.equal(summary[1].replace(/<[^>]+>/g, '').trim(), title);
  return { block, start: blocks[0].index, text: inner.replace(/<[^>]+>/g, '') };
}

test('step 6 keeps its action visible and folds why the pairings work', () => {
  const section = stepSection('Choose tax rounding for your pricing mode', 'Prepare the channel and stock, then restart Vendure');
  const { block, start, text } = closedBlock(section, 'Why these pairings');
  assert.ok(text.includes('multiple rates can still need'));
  assert.ok(section.replace(/<[^>]+>/g, '').includes('use it for orderTaxCalculationStrategy instead.'));
  assert.ok(section.indexOf('instead.') < start);
  assert.ok(!block.includes('For inclusive pricing'));
});

test('step 7 folds how POS sales take stock and keeps the server-start actions visible', () => {
  const section = stepSection('Prepare the channel and stock, then restart Vendure', 'Sign in and make a sale');
  const { block, start, text } = closedBlock(section, 'How POS sales take stock.');
  assert.ok(text.includes('A per-sale locationId is refused'));
  const actions = section.indexOf('On server start the plugin creates');
  assert.ok(actions > start + block.length);
});

test('the folded step 6 and step 7 text stays in the llms text, as titled asides', () => {
  const llms = readFileSync('.next/server/app/llms.mdx/docs/quick-start.body', 'utf8');
  assert.ok(llms.includes('> **Why these pairings:** The single-rate totals match'));
  assert.match(llms, /^> \*\*How POS sales take stock\.:?\*\* The plugin wraps/m);
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

test('step 9 is a symptom → fix list and leaves the LAN http aside to Troubleshooting', () => {
  // Round 19, J4 C4: one bold symptom per item, each quoted till message kept verbatim.
  const section = stepSection('Troubleshoot', 'Optional: a device key for each till');
  const items = Array.from(section.matchAll(/<li\b[^>]*>((?:(?!<\/li>)[\s\S])*)<\/li>/g));
  assert.equal(items.length, 5);
  for (const [, inner] of items) assert.match(inner, /^\s*<strong>/);
  const text = section.replaceAll('&#x27;', "'");
  for (const message of [
    '“Your session has ended. Sign in again to keep selling.”',
    '“The store refused this sign-in. Sign in again below; orders are kept.”',
    "“This store's VendurePOS plugin is missing or out of date. Install or update it, then this till continues.”",
    "“Sales aren't reaching the online store. Keep selling: they're saved on this till and will send by themselves.”",
  ]) {
    assert.ok(text.includes(message), message);
  }
  assert.ok(!section.includes('VENDUREPOS_WEB_ALLOW_LAN_HTTP'));
  assert.ok(section.includes('href="/docs/troubleshooting#fix-cors-401-or-plain-http-store-problems"'));
  const troubleshooting = readFileSync('.next/server/app/docs/troubleshooting.html', 'utf8');
  assert.ok(troubleshooting.includes('id="fix-cors-401-or-plain-http-store-problems"'));
  assert.ok(troubleshooting.includes('VENDUREPOS_WEB_ALLOW_LAN_HTTP'));
  assert.ok(troubleshooting.includes('mixed-content'));
});

test('step 8h points to Check it worked instead of repeating its checks', () => {
  // Round 21, J5 C4: item h named the same checks as the list below it.
  const section = stepSection('Sign in and make a sale', 'Troubleshoot');
  const list = section.match(/<div\b[^>]*class="[^"]*\bsteps-lettered\b[^"]*"[^>]*>\s*<ol\b[^>]*>((?:(?!<\/ol>)[\s\S])*)<\/ol>/);
  assert.ok(list);
  const items = Array.from(list[1].matchAll(/<li\b[^>]*>((?:(?!<\/li>)[\s\S])*)<\/li>/g));
  assert.equal(items.length, 9);
  const h = items[7][1];
  assert.ok(h.includes('Check it worked'));
  assert.ok(!h.includes('stock reduction'));
  assert.ok(!h.includes('delivered fulfilment'));
  const check = section.indexOf('Check it worked.', list.index + list[0].length);
  assert.ok(check >= 0);
  const bullets = section.slice(check).match(/<ul\b[^>]*>((?:(?!<\/ul>)[\s\S])*)<\/ul>/);
  assert.ok(bullets);
  for (const phrase of ['line prices', 'tally-pos', 'delivered', 'went down', 'tallySaleAt']) {
    assert.ok(bullets[1].includes(phrase), phrase);
  }
});
