import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const html = readFileSync('.next/server/app/docs/quick-start.html', 'utf8');

test('quick start omits the internal ADR tag', () => {
  assert.doesNotMatch(html, /ADR-?0*48/);
});

const textOf = (fragment) => fragment.replace(/<[^>]*>/g, '');

test('step 3 runs its two commands from terminal blocks, not prose', () => {
  const section = stepSection('Generate and run the migration', 'Enable bearer authentication');
  const figures = Array.from(section.matchAll(/<figure\b(?:(?!<\/figure>)[\s\S])*<\/figure>/g));
  const terminals = figures.filter(([figure]) => figure.includes('>Terminal</figcaption>'));
  assert.equal(terminals.length, 2);
  assert.ok(textOf(terminals[0][0]).includes('npx tsx src/generate-migration.ts'));
  assert.ok(textOf(terminals[1][0]).includes('npx tsx src/run-migrations.ts'));
  const runCode = figures.find(([figure]) => textOf(figure).includes('runMigrations(config)'));
  assert.ok(runCode && terminals[1].index > runCode.index);
  for (const [paragraph] of section.matchAll(/<p\b(?:(?!<\/p>)[\s\S])*<\/p>/g)) {
    assert.ok(!textOf(paragraph).includes('npx tsx'), paragraph);
  }
});

test('quick start links the setup warnings before a live sale', () => {
  assert.ok(html.includes('Before a sale on a live store'));
  assert.ok(html.includes('href="/docs/plugin-setup#set-up-email"'));
  assert.ok(html.includes('href="/docs/plugin-setup#check-your-own-code"'));
});

test('quick start includes the success checklist', () => {
  assert.match(html, /<h3\b[^>]*\bid="check-it-worked"[^>]*>((?:(?!<\/h3>)[\s\S])*)<\/h3>/);
  assert.ok(html.includes('tallySaleAt'));
});

test('quick start keeps tax rounding as a level-two heading', () => {
  assert.match(html, /<h2\b[^>]*>(?:(?!<\/h2>)[\s\S])*Choose tax rounding for your pricing mode(?:(?!<\/h2>)[\s\S])*<\/h2>/);
});

test('step 3 names the runner', () => {
  assert.ok(textOf(html).includes('npx tsx src/generate-migration.ts'));
  assert.ok(textOf(html).includes('npx tsx src/run-migrations.ts'));
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
  const mainPathEnd = section.indexOf('</pre>', lastCode);
  assert.ok(lastCode >= 0 && section.lastIndexOf('runMigrations', lastCode) >= 0);
  assert.ok(textOf(section.slice(lastCode, mainPathEnd)).includes('npx tsx src/run-migrations.ts'));
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

// Round 46, J4 C6/C3: step 4's permissions are a list, not a run of inline code in prose.
test('step 4 lists the till role permissions one per item', () => {
  const step4 = stepSection('Enable bearer authentication', 'Allow the POS origin through CORS');
  assert.ok(step4.includes('<ul'));
  const items = Array.from(step4.matchAll(/<li\b[^>]*>((?:(?!<\/li>)[\s\S])*)<\/li>/g)).map(([, inner]) => textOf(inner).trim());
  assert.equal(items.length, 6);
  ['TallyPosSell', 'ReadCatalog', 'ReadSettings', 'ReadCustomer', 'CreateCustomer', 'ReadOrder'].forEach((permission, i) => {
    assert.ok(items[i].startsWith(permission), items[i]);
  });
  assert.ok(items[0].includes('CreateOrder'), items[0]);
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
  const heading = section.slice(list.index + list[0].length).match(/<h3\b[^>]*\bid="check-it-worked"[^>]*>((?:(?!<\/h3>)[\s\S])*)<\/h3>/);
  assert.ok(heading);
  const check = list.index + list[0].length + heading.index;
  const bullets = section.slice(check).match(/<ul\b[^>]*>((?:(?!<\/ul>)[\s\S])*)<\/ul>/);
  assert.ok(bullets);
  for (const phrase of ['line prices', 'tally-pos', 'delivered', 'went down', 'tallySaleAt']) {
    assert.ok(bullets[1].includes(phrase), phrase);
  }
});

test('Check it worked is a level-three heading that item h links to', () => {
  // Round 26, J4 C3: a bold run-in paragraph was missing from the table of contents.
  const section = stepSection('Sign in and make a sale', 'Troubleshoot');
  const list = section.match(/<div\b[^>]*class="[^"]*\bsteps-lettered\b[^"]*"[^>]*>\s*<ol\b[^>]*>((?:(?!<\/ol>)[\s\S])*)<\/ol>/);
  assert.ok(list);
  const heading = section.match(/<h3\b[^>]*\bid="check-it-worked"[^>]*>((?:(?!<\/h3>)[\s\S])*)<\/h3>/);
  assert.ok(heading);
  // Fumadocs wraps the heading text in a self-link and appends a "Copy Anchor Link" button.
  const label = heading[1].match(/<a\b[^>]*>((?:(?!<\/a>)[\s\S])*)<\/a>/);
  assert.ok(label);
  assert.equal(textOf(label[1]).trim(), 'Check it worked');
  assert.ok(heading.index > list.index + list[0].length);
  assert.ok(html.split('href="#check-it-worked"').length - 1 >= 2);
  const items = Array.from(list[1].matchAll(/<li\b[^>]*>((?:(?!<\/li>)[\s\S])*)<\/li>/g));
  assert.ok(items[7][1].includes('href="#check-it-worked"'));
});

test('step 4 points to one administrator per cashier on Connect a till', () => {
  // Round 23, J2 C3: step 4 named the till role but never said to give each cashier their own login.
  const step4 = stepSection('Enable bearer authentication', 'Allow the POS origin through CORS');
  assert.ok(step4.includes('Give each cashier their own administrator'));
  assert.ok(step4.includes('href="/docs/connect-a-till#give-each-cashier-their-own-account"'));
  const connect = readFileSync('.next/server/app/docs/connect-a-till.html', 'utf8');
  assert.ok(connect.includes('id="give-each-cashier-their-own-account"'));
});

test('the intro names the Node requirement and links Plugin setup', () => {
  // Round 24, J3 C3: the prerequisites omitted the plugin's Node engines range.
  const step1 = html.search(/<h2\b[^>]*>(?:(?!<\/h2>)[\s\S])*1\. Install the plugin/);
  assert.ok(step1 >= 0);
  const intro = html.slice(0, step1);
  assert.ok(intro.includes('^20.19 || &gt;=22.12'));
  assert.ok(intro.includes('href="/docs/plugin-setup#check-your-store"'));
  const setup = readFileSync('.next/server/app/docs/plugin-setup.html', 'utf8');
  assert.ok(setup.includes('id="check-your-store"'));
});

test('the intro links Vendure\'s install guide for visitors with no project', () => {
  // Round 26, J1 C3: the intro asked for a Vendure project but said nothing about getting one.
  const firstH2 = html.indexOf('<h2');
  assert.ok(firstH2 >= 0);
  const intro = html.slice(0, firstH2);
  const link = intro.match(/<a\b[^>]*\bhref="https:\/\/docs\.vendure\.io\/current\/framework\/getting-started\/installation"[^>]*>((?:(?!<\/a>)[\s\S])*)<\/a>/);
  assert.ok(link);
  assert.equal(textOf(link[1]).trim(), 'Installing Vendure with @vendure/create');
  const text = textOf(intro);
  const ask = text.indexOf('No Vendure project yet?');
  assert.ok(ask >= 0);
  assert.ok(text.includes('npx @vendure/create my-shop'));
  const run = text.indexOf('Run store commands from that project');
  assert.ok(run >= 0 && ask > run);
});

test('step 5 names the .env CORS_ORIGINS line and its comma-separated format', () => {
  // Round 27, J1 and J4 C3: step 5 said "the scaffold's CORS_ORIGINS allowlist" without naming the file or format.
  const step5 = stepSection('Allow the POS origin through CORS', 'Choose tax rounding');
  const text = textOf(step5).replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replace(/\s+/g, ' ');
  assert.ok(text.includes("the CORS_ORIGINS line in the project's .env file"));
  assert.ok(text.includes('comma-separated'));
  // Round 28, C6 (J1, J2, J4, J5): the one-line example wrapped at its comma on phones.
  assert.ok(text.includes('CORS_ORIGINS=https://app.vendurepos.com'));
  assert.ok(text.includes('add the exact local POS origin after a comma'));
  for (const [pre] of step5.matchAll(/<pre\b(?:(?!<\/pre>)[\s\S])*<\/pre>/g)) {
    const code = textOf(pre).replaceAll('&#x27;', "'").replaceAll('&quot;', '"').replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>').replaceAll('&amp;', '&');
    for (const line of code.split('\n')) {
      assert.ok(line.length <= 40 || line.includes(' '), line);
    }
  }
  const without = text.indexOf('A project without CORS_ORIGINS');
  const objectForm = text.indexOf('origin: [');
  assert.ok(without >= 0 && objectForm > without);
  assert.ok(!text.includes("the scaffold's"));
});

test('step 5 captions its CORS_ORIGINS line as a .env file, not a terminal', () => {
  // Round 29, C3 (J1, J4): the .env line was captioned "Terminal".
  const start = html.search(/<h2\b[^>]*\bid="5-allow-the-pos-origin-through-cors"/);
  assert.ok(start >= 0);
  const end = html.indexOf('<h2', start + 1);
  assert.ok(end > start);
  const step5 = html.slice(start, end);
  const figures = Array.from(step5.matchAll(/<figure\b(?:(?!<\/figure>)[\s\S])*<\/figure>/g));
  const env = figures.find(([figure]) => textOf(figure).includes('CORS_ORIGINS=https://app.vendurepos.com'));
  assert.ok(env);
  const caption = env[0].match(/<figcaption\b[^>]*>((?:(?!<\/figcaption>)[\s\S])*)<\/figcaption>/);
  assert.ok(caption);
  assert.equal(textOf(caption[1]).trim(), '.env file');
  assert.ok(!env[0].includes('Terminal'));
});

test('the intro gives one address for the till; step 5 keeps the vercel.app note', () => {
  // Round 31, J1 C3: two addresses for one till in the intro.
  const firstH2 = html.indexOf('<h2');
  assert.ok(firstH2 >= 0);
  const intro = textOf(html.slice(0, firstH2));
  assert.ok(intro.includes('app.vendurepos.com'));
  assert.ok(!intro.includes('vendurepos.vercel.app'));
  const step5 = textOf(stepSection('Allow the POS origin through CORS', 'Choose tax rounding')).replace(/\s+/g, ' ');
  const note = step5.indexOf('keeps it for as long as anyone');
  assert.ok(note >= 0);
  assert.ok(step5.lastIndexOf('vendurepos.vercel.app', note) >= 0);
});

test('step 5 folds the vercel.app note into a closed callout after its explanation', () => {
  // Round 32, J5 C3: a note a new installer cannot act on sat in step 5's main text.
  const section = stepSection('Allow the POS origin through CORS', 'Choose tax rounding');
  const { start, text } = closedBlock(section, 'If your store already allows vendurepos.vercel.app');
  assert.ok(text.replace(/\s+/g, ' ').includes('keeps it for as long as anyone still opens the POS at that address'));
  const before = textOf(section.slice(0, start)).replace(/\s+/g, ' ');
  assert.ok(before.includes('Origins contain no path'));
  assert.ok(!before.includes('keeps it for as long as anyone'));
});

test('a folded callout is a plain bordered disclosure, not a callout frame; plain callouts keep their icon', () => {
  // Round 33, J4 C5: folds showed an info icon beside the disclosure triangle.
  // Round 52, J4 C5: folds reused the callout's shadow and coloured rule.
  const frame = 'rounded-xl border bg-fd-card';
  for (const page of ['quick-start', 'troubleshooting', 'at-the-till']) {
    const doc = readFileSync(`.next/server/app/docs/${page}.html`, 'utf8');
    const folds = Array.from(doc.matchAll(/<details\b[^>]*>/g));
    assert.ok(folds.length >= 1, page);
    for (const { 0: tag, index } of folds) {
      const where = `${page} @${index}`;
      assert.ok(tag.includes('rounded-lg border') && !tag.includes('shadow'), where);
      const before = doc.slice(Math.max(0, index - 200), index);
      assert.ok(!/min-w-0 flex-1">\s*$/.test(before) && !/role="none"/.test(before), where);
      const body = doc.slice(index, doc.indexOf('</details>', index));
      assert.ok(!body.slice(0, body.indexOf('<summary')).includes('<svg'), where);
    }
  }
  const title = html.indexOf('Before a sale on a live store');
  assert.ok(title >= 0);
  const start = html.lastIndexOf(frame, title);
  assert.ok(start >= 0);
  assert.ok(html.slice(start, title).includes('<svg'));
});
