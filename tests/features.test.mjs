import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('home lists the features added since the first release', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  for (const title of [
    'Park a sale, resume it later',
    'Change a line price',
    'Customers at the till',
    'Line and order discounts',
  ]) {
    assert.ok(html.includes(title), title);
  }
});

test('home cards say what sale replay, the register and scanners mean at the counter', () => {
  // Round 23, J1 C1: the cards after the hero lead with plain words, not engineer terms.
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  for (const phrase of [
    'never makes a second order',
    'Open and close the register',
    'Count the cash in the drawer',
    'type the code like a keyboard',
    '>Read the acceptance test</a>',
    '>Read the 200-send test</a>',
  ]) {
    assert.ok(html.includes(phrase), phrase);
  }
  for (const phrase of ['idempotency ledger', 'counted float', 'Registers and Z reports']) {
    assert.ok(!html.includes(phrase), phrase);
  }
});

test('home has the demo parity table', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  assert.ok(html.includes('Live demo or your own store'));
  assert.ok(html.includes('>Live demo</th>'));
  assert.ok(html.includes('>Your Vendure store</th>'));
  assert.equal(Array.from(html.matchAll(/<th scope="col"/g)).length, 3);
  assert.equal(Array.from(html.matchAll(/<th scope="row"/g)).length, 7);
});

test('home names split payment', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  // vendurepos/app 1404f42 apps/pos/e2e/sign-in.spec.ts: a split sale, part cash and part card.
  const start = html.indexOf('Cash, card and receipts');
  assert.ok(start >= 0);
  const card = html.slice(start, html.indexOf('</p>', start));
  assert.match(card, /split/i);
});

test('docs index and quick start link the live demo', () => {
  for (const file of ['docs.html', 'docs/quick-start.html']) {
    const html = readFileSync(join('.next/server/app', file), 'utf8');
    // The nav links the demo on every docs page, so look for the body's own lowercase "live demo" link.
    assert.match(html, /<a href="https:\/\/demo\.vendurepos\.com\/demo"[^>]*>live demo<\/a>/, file);
  }
  const site = readFileSync('lib/site.ts', 'utf8');
  assert.ok(site.includes("DEMO_URL = 'https://demo.vendurepos.com/demo'"));
});

test('every home feature and demo row cites a vendurepos/app test', () => {
  const source = readFileSync('app/(home)/page.tsx', 'utf8');
  let previous = '';
  let count = 0;
  for (const line of source.split('\n')) {
    if (/^\s*(?:title|capability): /.test(line)) {
      assert.match(previous, /^\s*\/\/.*\.(?:spec|test|e2e)\.ts\b/, line);
      count += 1;
    }
    if (line.trim()) previous = line;
  }
  assert.ok(count >= 16, `Expected at least 16 feature and demo rows, found ${count}`);
});

test('hero puts the live demo first, as the primary button', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const demo = '<a href="https://demo.vendurepos.com/demo" class="rounded-md bg-fd-primary px-6 py-3 text-fd-primary-foreground hover:bg-fd-primary/90">Live demo</a>';
  const quickStart = '<a class="rounded-md border border-fd-border px-6 py-3 hover:bg-fd-accent" href="/docs/quick-start">Quick start</a>';
  assert.ok(html.includes(demo));
  assert.ok(html.includes(quickStart));
  assert.ok(html.indexOf(demo) < html.indexOf(quickStart));
  const hero = html.slice(0, html.indexOf('</section>'));
  assert.equal(Array.from(hero.matchAll(/class="rounded-md bg-fd-primary/g)).length, 1);
  assert.equal(Array.from(html.matchAll(/class="rounded-md bg-fd-primary/g)).length, 2);
});

test('hero has two buttons, no GitHub link, and the note links the quick start', () => {
  // Round 18, C1: Try with your store moves into the note under the buttons; GitHub stays in the header.
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const h1 = html.indexOf('<h1');
  const figure = html.indexOf('<figure');
  assert.ok(h1 !== -1 && figure > h1);
  const hero = html.slice(h1, figure);
  const buttons = Array.from(hero.matchAll(/<a\b[^>]*\bclass="[^"]*\bpx-6 py-3\b[^"]*"[^>]*>([^<]*)<\/a>/g));
  assert.deepEqual(buttons.map((m) => m[1]), ['Live demo', 'Quick start']);
  assert.match(buttons[0][0], /\bbg-fd-primary\b/);
  assert.ok(!hero.includes('href="https://github.com/vendurepos/app"'));
  const noteAt = hero.indexOf('Your own store needs the plugin on your Vendure server first');
  assert.ok(noteAt > hero.indexOf('Quick start</a>'));
  const note = hero.slice(noteAt);
  assert.match(note, /<a[^>]*\shref="\/docs\/quick-start"[^>]*>quick start<\/a>/);
});

test('home header links Quick start; docs pages leave it to the sidebar', () => {
  // Round 24, J1 C1: one name for the own-store path; the quick start installs the plugin, then signs the till in.
  // Round 27, all judges: docs pages drop the header Docs and Quick start links; the sidebar lists Overview and Quick start.
  // The nav link is the one straight after the nav's Live demo link (the hero button and sidebar item also say Quick start).
  const navQuickStart = />Live demo<\/a>(?:<\/li><li\b[^>]*>)?<a\b[^>]*\shref="\/docs\/quick-start"[^>]*>Quick start<\/a>/;
  for (const file of ['index.html', 'docs.html']) {
    const html = readFileSync(join('.next/server/app', file), 'utf8');
    if (file === 'index.html') {
      assert.match(html, navQuickStart, file);
    } else {
      // In the docs sidebar Fumadocs puts an external-link icon before the text.
      assert.match(html, /<a\b[^>]*\shref="https:\/\/demo\.vendurepos\.com\/demo"[^>]*>(?:<svg\b.*?<\/svg>)?Live demo<\/a>/, file);
      assert.doesNotMatch(html, navQuickStart, file);
      assert.doesNotMatch(html, /<a\b[^>]*\shref="\/docs"[^>]*>Docs<\/a>/, file);
    }
    assert.doesNotMatch(html, />Connect your store<\/a>/, file);
    assert.doesNotMatch(html, /<a\b[^>]*>[^<]*Try with your store/, file);
  }
  // On the quick start itself only the sidebar item is active, not the header link too (as #125 did for Docs).
  const page = readFileSync(join('.next/server/app', 'docs/quick-start.html'), 'utf8');
  const active = Array.from(page.matchAll(/<a\b[^>]*>/g)).filter(
    (m) => m[0].includes('href="/docs/quick-start"') && m[0].includes('data-active="true"'),
  );
  assert.equal(active.length, 1);
});

test('hero note says the quick start ends with a sale, not a separate app link', () => {
  // Round 24, J1 C1: quick-start.mdx step 8 is "Sign in and make a sale".
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const hero = html.slice(html.indexOf('<h1'), html.indexOf('<figure'));
  assert.ok(hero.includes('signs the till in and makes a sale'));
  assert.ok(!hero.includes('try the till with your store'));
});

test('the two proof claims link their tests', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  assert.match(html, /<a href="https:\/\/github\.com\/vendurepos\/app\/blob\/main\/apps\/pos\/e2e\/offline\.spec\.ts"[^>]*>Read the acceptance test<\/a>/);
  assert.match(html, /<a href="https:\/\/github\.com\/vendurepos\/app\/blob\/main\/packages\/vendure-plugin\/test\/replay\.e2e\.ts"[^>]*>Read the 200-send test<\/a>/);
  assert.equal(Array.from(html.matchAll(/<a\b[^>]*\bhref="https:\/\/github\.com\/vendurepos\/app\/blob\/main\//g)).length, 2);
});

// Round 45, J4 C5, P5: the two test-backed claims lead as cards; the other eight are a frameless checklist.
test('home features: two test-backed cards lead, the other eight are a frameless checklist', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const start = html.indexOf('What it does today</h2>');
  assert.ok(start >= 0);
  const end = html.indexOf('<section', start);
  assert.ok(end > start);
  const slice = html.slice(start, end);
  const ul = slice.indexOf('<ul');
  assert.ok(ul >= 0);
  assert.equal(slice.split('<ul').length - 1, 1);
  const cards = Array.from(slice.matchAll(/<[a-z]+\b[^>]*\bclass="[^"]*\bbg-fd-card\b[^"]*"[^>]*>/g));
  assert.equal(cards.length, 2);
  const offline = slice.indexOf('Keeps selling offline');
  const once = slice.indexOf('Every sale lands once');
  assert.ok(cards[0].index < offline && offline < cards[1].index, 'first card holds Keeps selling offline');
  assert.ok(cards[1].index < once && once < ul, 'second card holds Every sale lands once');
  const list = slice.slice(ul);
  let at = 0;
  for (const title of [
    'Paid, fulfilled, at the till&#x27;s price',
    'Open and close the register',
    'Cash, card and receipts',
    'Barcode scanners',
    'Park a sale, resume it later',
    'Change a line price',
    'Customers at the till',
    'Line and order discounts',
  ]) {
    const found = list.indexOf(`>${title}</h3>`, at);
    assert.ok(found > at, title);
    assert.match(list.slice(list.lastIndexOf('<', found), found + 1), /^<h3\b/, title);
    at = found;
  }
  assert.doesNotMatch(list, /\bbg-fd-card\b/);
  assert.doesNotMatch(list, /\bclass="[^"]*\bborder\b/);
  const links = Array.from(slice.matchAll(/<a\b[^>]*\bhref="https:\/\/github\.com\/vendurepos\/app\/blob\/main\/[^>]*>/g));
  assert.equal(links.length, 2);
  for (const [tag] of links) {
    assert.match(tag, /\bclass="[^"]*\brounded-md\b/);
    assert.match(tag, /\bclass="[^"]*\bborder\b/);
    assert.doesNotMatch(tag, /\brounded-full\b/);
  }
  assert.equal(slice.split('<h3').length - 1, 10);
});

test('before you start gates refunds on the plugin and names coupon codes as not yet', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  // plugin-v0.3.0 (2d3699e) info.controller.ts:29 (no order.refund); vendurepos/app 1404f42 apps/pos/lib/discount-total-matrix.test.ts:171-178.
  const heading = html.indexOf('Before you start');
  const end = html.indexOf('</section>', heading);
  assert.ok(heading >= 0 && end > heading);
  const block = html.slice(heading, end);
  assert.match(block, /Coupon codes are not supported yet/);
  assert.match(block, /On plugin 0\.3\.0,\s+refunds go through the Vendure Dashboard; the live demo also refunds at the till\./);
  assert.doesNotMatch(block, /Not yet: refunds/i);
});

test('before you start links the staff guide, At the till', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const heading = html.indexOf('Before you start');
  const end = html.indexOf('</section>', heading);
  assert.ok(heading >= 0 && end > heading);
  assert.match(html.slice(heading, end), /href="\/docs\/at-the-till"[^>]*>At the till</);
});

test('before you start says what goes on the counter, right after the web till item', () => {
  // Round 22, J2 C2: the counter facts were only on Limitations. Same facts as content/docs/limitations.mdx:15, :30-31, :39, :41-42.
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const heading = html.indexOf('Before you start</h2>');
  assert.ok(heading >= 0);
  const counter = html.indexOf('>At the counter</h3>', heading);
  assert.ok(counter > heading, 'an "At the counter" group');
  const list = html.slice(counter).match(/<ul\b[^>]*>[\s\S]*?<\/ul>/)[0];
  const items = Array.from(list.matchAll(/<li>([\s\S]*?)<\/li>/g), (m) => m[1]);
  assert.match(items[0], /^A web till for now/);
  const item = items[1];
  for (const phrase of ['one tab per till', 'desktop Chrome', 'print dialog', 'cash drawer']) {
    assert.ok(item.includes(phrase), phrase);
  }
  assert.match(item, /<a\b[^>]*\shref="\/docs\/limitations"[^>]*>Limitations<\/a>/);
});

test('limitations still states the counter facts the home page repeats', () => {
  const html = readFileSync(join('.next/server/app', 'docs/limitations.html'), 'utf8');
  const article = html.slice(html.indexOf('<article'), html.indexOf('</article>'));
  for (const phrase of ['desktop Chrome', 'One browser tab per till', 'print dialog', 'does not open a cash drawer']) {
    assert.ok(article.includes(phrase), phrase);
  }
});

test('home offline card says the till tab must stay open', () => {
  // Round 29, C2 (J2): the home offline card did not say the tab must stay open.
  // Visible HTML only: drop <head> and every <script> (the RSC payload repeats the text).
  const raw = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const html = raw
    .slice(raw.indexOf('</head>'))
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replaceAll('<!-- -->', '');
  const phrase = "With the till's tab left open, sales made with the network off";
  assert.equal(html.split(phrase).length - 1, 1);
  const at = html.indexOf(phrase);
  const title = html.indexOf('Keeps selling offline');
  const link = html.indexOf('Read the acceptance test');
  assert.ok(title >= 0 && title < at, 'after the title');
  assert.ok(link > at, 'before the test link');
});

// Round 41, J2 C2: the offline card carries the reload and site-data caveat next to its promise.
test('home offline card says a reload needs the connection and unsent sales live in this browser', () => {
  const raw = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const html = raw
    .slice(raw.indexOf('</head>'))
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replaceAll('<!-- -->', '');
  const caveat = "Until they are sent, those sales live only in the till's browser: a reload needs the connection, and clearing that browser's data for the till loses them.";
  assert.equal(html.split(caveat).length - 1, 1);
  assert.ok(!html.includes("this site's data"), 'no longer says "this site\'s data"');
  const at = html.indexOf(caveat);
  const promise = html.indexOf("With the till's tab left open");
  const run = html.indexOf('Our acceptance run makes 25 sales');
  assert.ok(promise >= 0 && promise < at, 'after the tab-left-open promise');
  assert.ok(run > at, 'before the acceptance run');
});

test('home header links At the till; docs pages leave it to the sidebar', () => {
  // Round 31, J2 C1: the home header links the cashier guide; docs pages leave it to the sidebar.
  // The nav link is the one straight after the nav's Quick start link (the home page body also links At the till).
  const navAtTheTill = />Quick start<\/a>(?:<\/li><li\b[^>]*>)?<a\b[^>]*\shref="\/docs\/at-the-till"[^>]*>At the till<\/a>/;
  assert.match(readFileSync(join('.next/server/app', 'index.html'), 'utf8'), navAtTheTill, 'index.html');
  // Docs pages drop the header Quick start link, so a header At the till link there would follow Live demo.
  const docsAtTheTill = />Live demo<\/a>(?:<\/li><li\b[^>]*>)?<a\b[^>]*\shref="\/docs\/at-the-till"[^>]*>At the till<\/a>/;
  for (const file of ['docs.html', 'docs/at-the-till.html']) {
    assert.doesNotMatch(readFileSync(join('.next/server/app', file), 'utf8'), navAtTheTill, file);
    assert.doesNotMatch(readFileSync(join('.next/server/app', file), 'utf8'), docsAtTheTill, file);
  }
  // On the cashier guide itself only the sidebar item is active.
  const page = readFileSync(join('.next/server/app', 'docs/at-the-till.html'), 'utf8');
  const active = Array.from(page.matchAll(/<a\b[^>]*>/g)).filter(
    (m) => m[0].includes('href="/docs/at-the-till"') && m[0].includes('data-active="true"'),
  );
  assert.equal(active.length, 1);
});

// Round 45, J2 C2: the home refund row says settling takes two Admin API calls and links the steps.
test('home refund row says settling takes two Admin API calls and links Plugin setup', () => {
  const raw = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const html = raw.slice(raw.indexOf('</head>')).replace(/<script[\s\S]*?<\/script>/g, '');
  const row = (html.match(/<tr\b[\s\S]*?<\/tr>/g) ?? []).find((tr) => tr.includes('Refund a sale at the till'));
  assert.ok(row, 'the refund row');
  const text = row.replaceAll('<!-- -->', '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');
  assert.ok(
    text.includes('The refund stays Pending until an administrator settles it with two Admin API calls; see Plugin setup.'),
    text,
  );
  assert.match(row, /<a\b[^>]*\shref="\/docs\/plugin-setup#settle-a-dashboard-refund"/);
  const setup = readFileSync(join('.next/server/app', 'docs/plugin-setup.html'), 'utf8');
  assert.ok(setup.includes('id="settle-a-dashboard-refund"'), 'the anchor exists');
});

// Round 49, J2 C1, J4 and J1 C5: the counter group comes first, the lists are text-sm, and the page ends on the hero's buttons.
test('before you start groups the counter before the store setup and ends on the demo and quick start buttons', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const start = html.indexOf('Before you start</h2>');
  assert.ok(start >= 0);
  const section = html.slice(start, html.indexOf('</section>', start));
  const a = section.indexOf('>At the counter</h3>');
  const b = section.indexOf('>Setting up the store</h3>');
  assert.ok(a >= 0 && b > a, 'the counter group comes before the store setup group');
  for (const phrase of ['Coupon codes are not supported yet', 'one tab per till']) {
    assert.ok(section.slice(a, b).includes(phrase), phrase);
  }
  for (const phrase of ['^20.19', 'Postgres', '@vendurepos/plugin', 'RXDB_PREMIUM']) {
    assert.ok(section.slice(b).includes(phrase), phrase);
  }
  const classWords = (attrs) => (attrs.match(/\sclass="([^"]*)"/)?.[1] ?? '').split(/\s+/);
  const lists = Array.from(section.matchAll(/<ul\b([^>]*)>/g), (m) => m[1]);
  assert.equal(lists.length, 2);
  for (const attrs of lists) assert.ok(classWords(attrs).includes('text-sm'), `<ul${attrs}> is text-sm`);
  const lastList = section.lastIndexOf('</ul>');
  const demo = section.match(/<a\b([^>]*)>Live demo<\/a>/);
  assert.ok(demo, 'a Live demo button');
  assert.match(demo[1], /\shref="https:\/\/demo\.vendurepos\.com\/demo"/);
  assert.ok(classWords(demo[1]).includes('bg-fd-primary'));
  assert.ok(demo.index > lastList, 'Live demo comes after the lists');
  const quick = section.match(/<a\b([^>]*)>Quick start<\/a>/);
  assert.ok(quick, 'a Quick start button');
  assert.match(quick[1], /\shref="\/docs\/quick-start"/);
  for (const word of ['border', 'px-6']) assert.ok(classWords(quick[1]).includes(word), word);
  assert.ok(quick.index > lastList, 'Quick start comes after the lists');
});
