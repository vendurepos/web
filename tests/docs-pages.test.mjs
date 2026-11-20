import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const blockPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const pages = [
  ['plugin-setup', 'Plugin setup'],
  ['connect-a-till', 'Connect a till'],
  ['at-the-till', 'At the till'],
  ['notifications', 'Notifications'],
  ['troubleshooting', 'Troubleshooting'],
  ['limitations', 'Limitations'],
];

for (const [slug, title] of pages) {
  test(`${slug} is built with its canonical, breadcrumb and sitemap entry`, () => {
    const html = readFileSync(join('.next/server/app', `docs/${slug}.html`), 'utf8');
    const url = `https://vendurepos.com/docs/${slug}`;
    assert.ok(html.includes(`<link rel="canonical" href="${url}"/>`));
    const data = Array.from(html.matchAll(blockPattern), ([, body]) => JSON.parse(body));
    assert.equal(data.length, 2);
    assert.equal(data[0]['@type'], 'BreadcrumbList');
    assert.equal(data[0].itemListElement.length, 3);
    assert.deepEqual(data[0].itemListElement[2], {
      '@type': 'ListItem',
      position: 3,
      name: title,
      item: url,
    });
    const sitemap = readFileSync(join('.next/server/app', 'sitemap.xml.body'), 'utf8');
    assert.ok(sitemap.includes(`<loc>${url}</loc>`));
    assert.doesNotMatch(html, /X report/);
  });
}

test('home links the limitations page', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  assert.ok(html.includes('href="/docs/limitations"'));
});

test('notifications shows the empty sheet, the plugin notice and the plugin setup link', () => {
  const html = readFileSync(join('.next/server/app', 'docs/notifications.html'), 'utf8');
  assert.ok(html.includes('No notifications'));
  assert.ok(html.includes('Update the VendurePOS plugin'));
  assert.ok(html.includes('href="/docs/plugin-setup"'));
});

// Round 41 (front desk row): the page says which messages can be turned off.
test('notifications says which messages show at the till and which can be turned off', () => {
  const html = readFileSync(join('.next/server/app', 'docs/notifications.html'), 'utf8');
  const text = html
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ');
  let from = 0;
  for (const phrase of [
    'Short messages at the till',
    'added to cart',
    'Sale complete',
    'Turn notifications on or off',
    'Show receipt after each sale',
    'asks for no notification permission',
  ]) {
    const at = text.indexOf(phrase, from);
    assert.ok(at >= 0, phrase);
    from = at + phrase.length;
  }
  assert.ok(text.includes('so the demo never shows this notice.'));
});

test('changelog lists 0.3.0, 0.2.0 and 0.1.0 newest first', () => {
  const html = readFileSync(join('.next/server/app', 'docs/changelog.html'), 'utf8');
  const v030 = html.indexOf('0.3.0 (2026-10-06)');
  const v020 = html.indexOf('0.2.0 (2026-10-06)');
  const v010 = html.indexOf('0.1.0 (2026-10-01)');
  assert.ok(v030 >= 0);
  assert.ok(v020 >= 0);
  assert.ok(v010 >= 0);
  assert.ok(v030 < v020);
  assert.ok(v020 < v010);
  assert.ok(html.includes('TALLY-CUSTOM-ITEM'));
  assert.ok(html.includes('tallyEnsurePosTillRole'));
  assert.doesNotMatch(html, /Unreleased/);
});

test('each changelog release opens with an In short paragraph before its list', () => {
  const html = readFileSync(join('.next/server/app', 'docs/changelog.html'), 'utf8');
  const visible = html.slice(html.indexOf('</head>')).replace(/<script[\s\S]*?<\/script>/g, '');
  const sections = visible.split(/<h2[\s>]/).slice(1);
  for (const release of ['0.3.0 (2026-10-06)', '0.2.0 (2026-10-06)', '0.1.0 (2026-10-01)']) {
    const section = sections.find((part) => part.includes(release));
    assert.ok(section, release);
    const inShort = section.search(/<p>\s*<strong>In short:<\/strong>/);
    assert.ok(inShort >= 0, release);
    assert.ok(inShort < section.indexOf('<li'), release);
  }
});

test('changelog intro names the source and npm package without repeating the subtitle', () => {
  const html = readFileSync(join('.next/server/app', 'docs/changelog.html'), 'utf8');
  assert.ok(html.includes('The source is'));
  assert.ok(html.includes('href="https://www.npmjs.com/package/@vendurepos/plugin"'));
  // Visible HTML only: drop <head> (meta/og/twitter tags) and every <script> (the RSC payload).
  const visible = html.slice(html.indexOf('</head>')).replace(/<script[\s\S]*?<\/script>/g, '');
  assert.equal(visible.split('newest first').length - 1, 1);
});

test('llms text carries no MDX comments', () => {
  const full = readFileSync(join('.next/server/app', 'llms-full.txt.body'), 'utf8');
  const directory = join('.next/server/app', 'llms.mdx/docs');
  const files = readdirSync(directory).filter((file) => file.endsWith('.body'));
  assert.ok(files.length >= 7);
  const texts = [full, ...files.map((file) => readFileSync(join(directory, file), 'utf8'))];
  for (const text of texts) {
    assert.ok(!text.includes('{/*'));
    assert.ok(!text.includes('absence at vendurepos/app'));
  }
  assert.ok(full.includes('# Limitations'));
  assert.ok(full.includes('plugins: [/* your existing plugins, */ TallyPosPlugin],'));
});

test("troubleshooting gives the plugin requirement in the quick start's terms", () => {
  const text = readFileSync('content/docs/troubleshooting.mdx', 'utf8');
  assert.ok(text.includes('advertise `order.create` v4 and register v1'));
  assert.ok(text.includes('/docs/quick-start#1-install-the-plugin'));
  assert.doesNotMatch(text, /Run plugin 0\.1\.0 or later/);
});

// Round 39, J5 C4: "must advertise v4" read against the Changelog's v5.
test('troubleshooting and quick start say plugin 0.3.0 advertises order.create 1–5, which includes v4', () => {
  const troubleshooting = readFileSync('content/docs/troubleshooting.mdx', 'utf8').replace(/\s+/g, ' ');
  assert.ok(troubleshooting.includes('does (0.3.0 advertises `order.create` 1–5, which includes v4).'));
  const quickStart = readFileSync('content/docs/quick-start.mdx', 'utf8');
  assert.ok(quickStart.includes('register v1; plugin 0.3.0 advertises `order.create` 1–5, which includes v4.'));
});

test('troubleshooting lists the header notices the till shows at app 1404f42', () => {
  const html = readFileSync(join('.next/server/app', 'docs/troubleshooting.html'), 'utf8')
    .replace(/&#x27;|&#39;|&apos;/g, "'");
  assert.doesNotMatch(html, /isn't answering/);
  assert.doesNotMatch(html, /keep failing/);
  assert.ok(html.includes("Till updates aren't reaching the online store"));
  assert.ok(html.includes('The store refused this account'));
  assert.ok(html.includes('id="act-on-a-header-notice"'));
});

test('limitations describes stock allocation as the quick start does', () => {
  const text = readFileSync('content/docs/limitations.mdx', 'utf8');
  assert.ok(text.includes("Vendure's stock allocation strategy"));
  assert.doesNotMatch(text, /channel's default stock location/);
  assert.ok(text.includes('The till cannot pick a location for a sale.'));
});

test('connect a till says where your data goes', () => {
  const html = readFileSync(join('.next/server/app', 'docs/connect-a-till.html'), 'utf8');
  const start = html.search(/<h2[^>]*>(?:(?!<\/h2>)[\s\S])*Where your data goes/);
  assert.ok(start >= 0);
  const end = html.indexOf('<h2', start + 3);
  const section = html.slice(start, end < 0 ? undefined : end);
  assert.match(section, /localStorage|this browser/);
  assert.match(section, /never saves the password/);
  assert.match(section, /Building it yourself needs your own RxDB Premium\s+licence token/);
  assert.doesNotMatch(section.replace(/<[^>]+>/g, ' '), /\b(secure|safe|private|trusted)\b/i);
});

test('limitations says a self-build needs an RxDB Premium licence token, with no price or plan', () => {
  const html = readFileSync(join('.next/server/app', 'docs/limitations.html'), 'utf8');
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
  assert.ok(strip(html).includes('Building the till yourself needs your own RxDB Premium licence token in RXDB_PREMIUM'));
  const li = html.match(/<li[^>]*>(?:(?!<\/li>)[\s\S])*?RxDB Premium(?:(?!<\/li>)[\s\S])*<\/li>/);
  assert.ok(li);
  assert.doesNotMatch(strip(li[0]), /[$€]|\bprice\b|\bpricing\b|\bplan\b/i);
});

test('limitations has a bullet naming the browser print dialog and the cash drawer', () => {
  // Round 15, C2: vendurepos/app@df046fc prints through the browser only; nothing opens a cash drawer.
  const html = readFileSync(join('.next/server/app', 'docs/limitations.html'), 'utf8');
  const items = html.match(/<li[^>]*>(?:(?!<\/li>)[\s\S])*<\/li>/g) ?? [];
  const bullet = items.map((li) => li.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')).find((text) => text.includes('print dialog'));
  assert.ok(bullet, 'a bullet names the print dialog');
  assert.match(bullet, /browser(&#x27;|&#39;|')s print dialog/);
  assert.match(bullet, /does not open a cash drawer/);
});

test("limitations names the tested browser and says unsent sales live only in the till's browser", () => {
  // Round 16, C2: vendurepos/app@a257d16 tests in desktop Chrome only; unsent orders are in the browser's SQLite.
  const html = readFileSync(join('.next/server/app', 'docs/limitations.html'), 'utf8');
  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/&#x27;|&#39;|&apos;/g, "'");
  assert.ok(text.includes('Its browser tests run in desktop Chrome'));
  assert.ok(text.includes("Sales not yet sent are kept only in the till's browser"));
  assert.ok(!text.includes("this site's data"), 'no longer says "this site\'s data"');
});

// Round 44, J2 C2: the untested devices are named, from the same Playwright config.
test('limitations and the home page say tablets and phones, an iPad included, are not tested yet', () => {
  // Visible text only: drop <head> and every <script> (the RSC payload repeats the page's text), then the tags.
  const visible = (page) => {
    const html = readFileSync(join('.next/server/app', page), 'utf8');
    return html
      .slice(html.indexOf('</head>'))
      .replace(/<script\b[\s\S]*?<\/script>/g, ' ')
      .replaceAll('<!-- -->', '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ');
  };
  const limitations = visible('docs/limitations.html');
  const home = visible('index.html');
  assert.ok(limitations.includes('other browsers, tablets and phones (an iPad included) are not tested yet.'));
  assert.ok(home.includes('tablets and phones, an iPad included, are not tested yet.'));
  for (const text of [limitations, home]) {
    assert.ok(!text.includes('iPad is not supported'));
    assert.ok(!text.includes('tablets are not supported'));
  }
});

test('connect a till shows the barcode custom field in a code block', () => {
  // Round 16, C3: vendurepos/app@a257d16 apps/pos/lib/barcode-field.ts:22-23 needs a single string or text ProductVariant field.
  const html = readFileSync(join('.next/server/app', 'docs/connect-a-till.html'), 'utf8');
  const blocks = (html.match(/<pre\b[\s\S]*?<\/pre>/g) ?? [])
    .map((pre) => pre.replace(/<[^>]+>/g, '').replace(/&#x27;|&#39;/g, "'"));
  assert.ok(blocks.some((code) => code.includes('ProductVariant') && code.includes("name: 'barcode'") && code.includes("type: 'string'")));
});

test('connect a till names the demo events and where they go', () => {
  const html = readFileSync(join('.next/server/app', 'docs/connect-a-till.html'), 'utf8');
  const start = html.indexOf('id="where-your-data-goes"');
  assert.ok(start >= 0);
  const end = html.indexOf('<h2', start);
  const section = html.slice(start, end < 0 ? undefined : end);
  for (const word of ['demo_opened', 'demo_signed_in', 'demo_sale_completed', 'demo_reset', 'PostHog']) {
    assert.ok(section.includes(word), word);
  }
});

test('connect a till says how to give each cashier their own account', () => {
  const html = readFileSync(join('.next/server/app', 'docs/connect-a-till.html'), 'utf8')
    .replace(/&#x27;|&#39;|&apos;/g, "'");
  const start = html.indexOf('id="give-each-cashier-their-own-account"');
  assert.ok(start >= 0);
  const end = html.indexOf('<h2', start);
  assert.ok(end > start);
  const section = html.slice(start, end);
  for (const permission of ['TallyPosSell', 'ReadCatalog', 'ReadSettings', 'ReadCustomer', 'CreateCustomer', 'ReadOrder']) {
    assert.ok(section.includes(permission), permission);
  }
  assert.ok(section.includes('Hand over'));
});

test('at the till links Hand over to the cashier accounts section', () => {
  const html = readFileSync(join('.next/server/app', 'docs/at-the-till.html'), 'utf8');
  assert.ok(html.includes('/docs/connect-a-till#give-each-cashier-their-own-account'));
});

test('connect a till device-key recipe says to add ReadOrder on plugin 0.3.0 and earlier', () => {
  const html = readFileSync(join('.next/server/app', 'docs/connect-a-till.html'), 'utf8');
  const start = html.indexOf('id="create-and-use-a-device-key"');
  assert.ok(start >= 0);
  const end = html.indexOf('<h2', start);
  const section = html.slice(start, end < 0 ? undefined : end);
  assert.ok(section.includes('ReadOrder'));
  assert.match(section, /href="(\/docs\/connect-a-till)?#give-each-cashier-their-own-account"/);
});

test('connect a till lists where your data goes in three short groups, every sentence kept', () => {
  const html = readFileSync(join('.next/server/app', 'docs/connect-a-till.html'), 'utf8');
  const start = html.indexOf('id="where-your-data-goes"');
  assert.ok(start >= 0);
  const end = html.indexOf('<h2', start);
  const section = html.slice(start, end < 0 ? undefined : end);
  for (const lead of ['Stored in this browser', 'What signing out deletes', 'Where requests go']) assert.ok(section.includes(lead), lead);
  assert.ok((section.match(/<li/g) ?? []).length >= 6);
  const strip = (s) => s.replace(/<[^>]+>/g, '');
  const lists = section.slice(0, section.indexOf('The till&#x27;s source is')); // that paragraph is out of scope
  assert.ok(lists.length > 0 && lists.length < section.length);
  for (const p of lists.match(/<p[\s>][\s\S]*?<\/p>/g) ?? []) assert.ok(strip(p).length <= 320, strip(p).slice(0, 60));
  const text = strip(section.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')).replace(/\s+/g, ' ');
  for (const sentence of ['It never saves the password.', 'Signing out deletes the catalogue but never the sales database',
    'with no cookie and nothing stored.', "the same one this website's page-view counter reports to.",
    'cannot be shown inside another site']) assert.ok(text.includes(sentence), sentence);
});

test('connect a till and the quick start name no release after 0.3.0', () => {
  // Front desk, 18 Nov: describe what plugin 0.3.0 (npm latest) does today; TallyPosPairDisplay is not in 0.3.0.
  for (const slug of ['connect-a-till', 'quick-start']) {
    const text = readFileSync(join('.next/server/app', `docs/${slug}.html`), 'utf8').replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(text, /after 0\.3\.0|not out yet|TallyPosPairDisplay/i, slug);
  }
});

test('home, at the till and limitations say what plugin 0.3.0 does today', () => {
  // Front desk, 18 Nov: plugin-v0.3.0 (2d3699e) advertises no order.refund; refunds go through the Dashboard.
  const text = (file) => readFileSync(join('.next/server/app', file), 'utf8').replace(/<[^>]+>/g, ' ');
  for (const file of ['index.html', 'docs/at-the-till.html', 'docs/limitations.html']) {
    assert.doesNotMatch(text(file), /after 0\.3\.0|not out yet|refund a till sale/i, file);
  }
  // Round 22: at the till names the owner's step in plain words; settleRefund lives on Plugin setup, linked from it.
  assert.ok(text('docs/at-the-till.html').includes('plugin 0.3.0'), 'plugin 0.3.0');
  assert.ok(readFileSync('.next/server/app/docs/at-the-till.html', 'utf8').includes('href="/docs/plugin-setup#settle-a-dashboard-refund"'), 'settle link');
});

test('limitations lists the refused till update right after the unsent sales and links troubleshooting', () => {
  // Round 23, J5 C2: same facts as troubleshooting.mdx (Till updates line); vendurepos/app@ebcd9e4, @tallyui/pos 3.20.0.
  const html = readFileSync(join('.next/server/app', 'docs/limitations.html'), 'utf8');
  const items = html.match(/<li[^>]*>(?:(?!<\/li>)[\s\S])*<\/li>/g) ?? [];
  const text = (li) => li.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/&#x27;|&#39;|&apos;/g, "'");
  const unsent = items.findIndex((li) => text(li).includes("Sales not yet sent are kept only in the till's browser"));
  assert.ok(unsent >= 0, 'the unsent-sales item');
  const refused = items[unsent + 1];
  assert.ok(refused, 'an item follows the unsent-sales item');
  for (const phrase of ['does not send it again', 'renumbers and sends once', 'sales keep sending']) {
    assert.ok(text(refused).includes(phrase), phrase);
  }
  assert.ok(refused.includes('href="/docs/troubleshooting#act-on-a-header-notice"'), 'troubleshooting link');
  const troubleshooting = readFileSync(join('.next/server/app', 'docs/troubleshooting.html'), 'utf8');
  assert.ok(troubleshooting.includes('id="act-on-a-header-notice"'), 'the link target exists');
});

// Round 42, J2 C2: Limitations says what a refused till update costs, from troubleshooting.mdx "Any other code".
test('limitations says refused register records do not reach the Vendure store', () => {
  const html = readFileSync(join('.next/server/app', 'docs/limitations.html'), 'utf8');
  const items = html.match(/<li[^>]*>(?:(?!<\/li>)[\s\S])*<\/li>/g) ?? [];
  const text = (li) => li.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/&#x27;|&#39;|&apos;/g, "'");
  const unsent = items.findIndex((li) => text(li).includes("Sales not yet sent are kept only in the till's browser"));
  assert.ok(unsent >= 0, 'the unsent-sales item');
  const refused = items[unsent + 1];
  assert.ok(refused, 'an item follows the unsent-sales item');
  const phrase = 'sales keep sending. None of those register records reach your Vendure store from this till, '
    + 'so keep the printed Z reports. See Troubleshooting';
  assert.ok(text(refused).includes(phrase), phrase);
});

// Round 43, J4 C4: Limitations' lists are tight like the other pages' (no <p> inside each item).
test('limitations lists are tight, with no paragraph inside an item', () => {
  const html = readFileSync(join('.next/server/app', 'docs/limitations.html'), 'utf8');
  const body = html.slice(html.indexOf('</head>')).replace(/<script\b[\s\S]*?<\/script>/g, '');
  const items = body.match(/<li[^>]*>(?:(?!<\/li>)[\s\S])*<\/li>/g) ?? [];
  assert.ok(items.length >= 15, `at least 15 items, found ${items.length}`);
  const loose = items.filter((li) => /^<li[^>]*>(?:\s|<!-- -->)*<p[\s>]/.test(li));
  assert.deepEqual(loose, [], 'no item opens with a <p>');
});

test('troubleshooting says what still works after a refused till update', () => {
  // Round 25, J2 C4: vendurepos/app@ebcd9e4 index.tsx:216-221 (printZ), closure-history-sheet.tsx:14-19, :38-47;
  // @tallyui/pos 3.20.0 register-outbox.ts:178-181 (closures wait behind the refused row).
  const text = readFileSync(join('.next/server/app', 'docs/troubleshooting.html'), 'utf8')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const start = text.indexOf('Any other code');
  const end = text.indexOf('till updates waiting to sync', start);
  assert.ok(start >= 0 && end > start, 'the Any other code case precedes till updates waiting to sync');
  const anyOther = text.slice(start, end);
  for (const phrase of ['What still works', 'The Z report still prints', 'Closures', 'do not reach your Vendure store']) {
    assert.ok(anyOther.includes(phrase), phrase);
  }
});

test('changelog ADR and pull request references are links to vendurepos/app', () => {
  // Round 24, J5 C4 / J4 C2: ADR 0005 at plugin-v0.3.0, ADR 0004 at plugin-v0.2.0; #116 and #117 are vendurepos/app PRs.
  const html = readFileSync(join('.next/server/app', 'docs/changelog.html'), 'utf8');
  const start = html.indexOf('<strong>In short:</strong>');
  const end = html.indexOf('the first release', start);
  assert.ok(start >= 0 && end > start, 'the 0.3.0 and 0.2.0 sections');
  const section = html.slice(start, end);
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const links = Array.from(section.matchAll(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g), ([, href, body]) => [strip(body), href]);
  const expected = {
    'ADR 0005': ['https://github.com/vendurepos/app/blob/plugin-v0.3.0/docs/adr/0005-order-create-v5.md', 4],
    'ADR 0004': ['https://github.com/vendurepos/app/blob/plugin-v0.2.0/docs/adr/0004-device-credentials.md', 3],
    '#116': ['https://github.com/vendurepos/app/pull/116', 1],
    '#117': ['https://github.com/vendurepos/app/pull/117', 1],
  };
  for (const [label, [href, count]] of Object.entries(expected)) {
    const found = links.filter(([text]) => text === label);
    assert.equal(found.length, count, label);
    for (const [, h] of found) assert.equal(h, href, label);
    assert.ok(strip(section).includes(`(${label})`), `(${label}) keeps its parentheses`);
  }
  const outside = strip(section.replace(/<a\s[^>]*>[\s\S]*?<\/a>/g, ''));
  assert.doesNotMatch(outside, /ADR 000|#11\d/);
});

test('connect a till says the browser SQLite is the till\'s own storage, not the server database', () => {
  // Round 29, C4 (J1): browser SQLite read as a contradiction of "SQLite are not supported".
  const html = readFileSync(join('.next/server/app', 'docs/connect-a-till.html'), 'utf8');
  const items = html.match(/<li[^>]*>(?:(?!<\/li>)[\s\S])*<\/li>/g) ?? [];
  const text = (li) => li.replace(/<[^>]+>/g, '').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/\s+/g, ' ');
  const storage = items.map(text).find((li) => li.includes('kept in SQLite databases inside this browser'));
  assert.ok(storage, 'the browser storage item');
  assert.ok(storage.includes("This is the till's own storage"), "the till's own storage");
  assert.ok(storage.includes('must be Postgres'), 'must be Postgres');
});

test('changelog till role bullet notes the missing ReadOrder and links the device key section', () => {
  // Round 30, C4 (J5): "does everything a till does" read as a contradiction of the ReadOrder caveat.
  const html = readFileSync(join('.next/server/app', 'docs/changelog.html'), 'utf8');
  const items = html.match(/<li[^>]*>(?:(?!<\/li>)[\s\S])*<\/li>/g) ?? [];
  const role = items.find((li) => li.includes('tallyEnsurePosTillRole'));
  assert.ok(role, 'the tallyEnsurePosTillRole item');
  const text = role.replace(/<[^>]+>/g, '').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/\s+/g, ' ');
  const claim = text.indexOf('does everything a till does');
  assert.ok(claim >= 0, 'does everything a till does');
  assert.ok(text.indexOf('Not in the release notes', claim) > claim, 'Not in the release notes, after the claim');
  assert.ok(text.indexOf('has no ReadOrder', claim) > claim, 'has no ReadOrder, after the claim');
  const anchor = 'create-and-use-a-device-key';
  assert.ok(role.includes(`href="/docs/connect-a-till#${anchor}"`), 'links the device key section');
  const connect = readFileSync(join('.next/server/app', 'docs/connect-a-till.html'), 'utf8');
  assert.ok(connect.includes(`id="${anchor}"`), 'connect a till has the anchor');
});

test('limitations says a reload needs the connection while the internet is down', () => {
  // Round 30, C2 (J2): Limitations did not say a reload needs the connection.
  const html = readFileSync(join('.next/server/app', 'docs/limitations.html'), 'utf8');
  const items = html.match(/<li[^>]*>(?:(?!<\/li>)[\s\S])*<\/li>/g) ?? [];
  const text = (li) => li.replace(/<[^>]+>/g, '').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/\s+/g, ' ');
  const item = items.find((li) => text(li).includes('keep its tab open'));
  assert.ok(item, 'the keep-its-tab-open item');
  assert.ok(text(item).includes('cannot load the till until the connection is back'), 'a reload needs the connection');
  assert.ok(item.includes('href="/docs/at-the-till#if-the-internet-drops"'), 'link to If the internet drops');
  const atTheTill = readFileSync(join('.next/server/app', 'docs/at-the-till.html'), 'utf8');
  assert.ok(atTheTill.includes('id="if-the-internet-drops"'), 'the At the till heading id');
});

test('limitations puts the counter limits under one heading and the store setup under another', () => {
  // Round 32, J2 C4 and J4 C4: one flat list mixed counter and developer limits.
  const html = readFileSync(join('.next/server/app', 'docs/limitations.html'), 'utf8');
  const heading = (name) => {
    // The heading's copy-link button carries the screen-reader text "Copy Anchor Link"; drop it.
    const text = (h) => h[1].replace(/<button[\s\S]*?<\/button>/g, '').replace(/<[^>]+>/g, '').trim();
    const match = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].find((h) => text(h) === name);
    assert.ok(match, `an h2 "${name}"`);
    return match.index;
  };
  const counter = heading('At the counter');
  const setup = heading('Setting up the store');
  assert.ok(counter < setup, 'At the counter comes before Setting up the store');
  const between = html.slice(counter, setup);
  const after = html.slice(setup);
  for (const phrase of ['does not open a cash drawer', 'One browser tab per till']) {
    assert.ok(between.includes(phrase), `${phrase}, at the counter`);
  }
  for (const phrase of ['RXDB_PREMIUM', 'Postgres only']) {
    assert.ok(after.includes(phrase), `${phrase}, after Setting up the store`);
    assert.ok(!between.includes(phrase), `${phrase}, not at the counter`);
  }
});

// Round 39, J4 C4: order.create was code in 0.1.0 and plain text in 0.3.0 and 0.2.0.
test('the changelog sets order.create as code everywhere', () => {
  const source = readFileSync(join('content/docs', 'changelog.mdx'), 'utf8');
  const prose = source.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/`[^`]*`/g, '');
  assert.ok(!prose.includes('order.create'), 'no order.create outside backticks');
  const count = (needle) => source.split(needle).length - 1;
  assert.ok(count('`order.create` v5') >= 3, '`order.create` v5 at least 3 times');
  assert.equal(count('`order.create` 1–5'), 1, '`order.create` 1–5 once');
});

// Round 41, J4 C2: 0.3.0 says it shares 0.2.0's date on purpose.
test('the changelog says 0.3.0 came out the same day as 0.2.0', () => {
  const html = readFileSync(join('.next/server/app', 'docs/changelog.html'), 'utf8');
  // Visible HTML only: drop <head> and every <script> (the RSC payload repeats the page's text).
  const text = html
    .slice(html.indexOf('</head>'))
    .replace(/<script\b[\s\S]*?<\/script>/g, ' ')
    .replaceAll('<!-- -->', '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ');
  const sentence = 'Released the same day as 0.2.0, a few hours later.';
  assert.equal(text.split(sentence).length - 1, 1, 'the same-day sentence once');
  const at = text.indexOf(sentence);
  const heading = text.indexOf('0.3.0 (2026-10-06)');
  assert.ok(heading >= 0 && heading < at, 'after the 0.3.0 heading');
  assert.ok(at < text.indexOf('In short:', heading), 'before In short:');
});

test('troubleshooting does not name till refunds as lost when site data is cleared (round 64, J5 C4)', () => {
  // On plugin 0.3.0 the till cannot refund (at-the-till.mdx:95, limitations.mdx:30-33).
  const html = readFileSync(join('.next/server/app', 'docs/troubleshooting.html'), 'utf8')
    .replace(/&#x27;|&#39;|&apos;/g, "'");
  assert.ok(html.includes("deletes this till's unsent sales and register records along with the refused update."));
  assert.ok(!html.includes('unsent sales, refunds'), 'no till refunds in the sentence');
});
