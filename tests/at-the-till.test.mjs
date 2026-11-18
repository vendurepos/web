import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const html = readFileSync('.next/server/app/docs/at-the-till.html', 'utf8');
const source = readFileSync('content/docs/at-the-till.mdx', 'utf8');

test('at the till names Checkout, Add charge and Split', () => {
  for (const label of ['Checkout', 'Add charge', 'Split']) {
    assert.ok(html.includes(`<strong>${label}</strong>`), label);
  }
});

test('at the till no longer offers the old Pay cash and Pay by card buttons', () => {
  assert.doesNotMatch(html, /Pay cash|Pay by card/);
});

test('at the till cites vendurepos/app 1404f42', () => {
  assert.match(source, /\{\/\* Sources: vendurepos\/app 1404f42 /);
});

test('at the till states the plugin gate for refunds', () => {
  const start = html.indexOf('id="refund-a-sale"');
  const end = html.indexOf('id="check-the-register-during-the-day"', start);
  assert.ok(start >= 0 && end > start);
  const section = html.slice(start, end);
  assert.match(section, /On plugin 0\.3\.0 the till cannot refund\./);
  assert.ok(section.includes('href="/docs/plugin-setup#settle-a-dashboard-refund"'), 'links the settle steps on Plugin setup');
});

test('at the till refund item 1 says in plain words who refunds, and leaves the API to Plugin setup', () => {
  // Round 21, J2 C4: a GraphQL mutation means nothing to an owner; the settle steps stay on Plugin setup.
  const start = html.indexOf('id="refund-a-sale"');
  const end = html.indexOf('id="check-the-register-during-the-day"', start);
  assert.ok(start >= 0 && end > start);
  const list = html.slice(start, end);
  const itemStart = list.indexOf('<li');
  const itemEnd = list.indexOf('</li>', itemStart);
  assert.ok(itemStart >= 0 && itemEnd > itemStart);
  const item = list.slice(itemStart, itemEnd);
  const text = item.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '');
  for (const words of ['Ask whoever manages your Vendure store', 'Pending']) assert.ok(text.includes(words), words);
  assert.ok(item.includes('href="/docs/plugin-setup#settle-a-dashboard-refund"'), 'links the settle steps');
  assert.doesNotMatch(text, /settleRefund|Admin API/);
  const setup = readFileSync('.next/server/app/docs/plugin-setup.html', 'utf8');
  assert.match(setup, /<h2[^>]*id="settle-a-dashboard-refund"/);
  assert.match(setup.replace(/<[^>]+>/g, ''), /settleRefund/);
});

test('at the till refund section leads with the plugin 0.3.0 cashier steps, then the live demo', () => {
  // Round 20: plugin-v0.3.0 register.service.ts:267-279 and register-figures.ts:22-27 count the till's own payments,
  // paid_in and paid_out, so a Dashboard refund needs a Pay out to keep the drawer count right.
  const start = html.indexOf('id="refund-a-sale"');
  const end = html.indexOf('id="check-the-register-during-the-day"', start);
  assert.ok(start >= 0 && end > start);
  const section = html.slice(start, end);
  const payOut = section.indexOf('Pay out');
  assert.ok(payOut >= 0 && payOut < section.indexOf('Refund items'), 'Pay out before Refund items');
  assert.ok(section.includes('href="/docs/plugin-setup#settle-a-dashboard-refund"'));
  assert.match(section, /<h3[^>]*>(?:(?!<\/h3>)[\s\S])*live demo/);
  assert.doesNotMatch(section, /settleRefund\(input/);
});

test('at the till order details leads with plugin 0.3.0', () => {
  const start = html.indexOf('id="order-details"');
  const end = html.indexOf('<h2', start);
  assert.ok(start >= 0 && end > start);
  const section = html.slice(start, end);
  const plugin = section.indexOf('On plugin 0.3.0');
  assert.ok(plugin >= 0 && plugin < section.indexOf('Customer note'), 'On plugin 0.3.0 before Customer note');
});

test('at the till says the customer note is public', () => {
  // vendurepos/app 1404f42 plugin CHANGELOG.md:6: kept as one public order note.
  assert.match(html, /public note in the order/);
});

test('at the till shows the payment and cashier screens in their sections', () => {
  const section = (id) => {
    const start = html.indexOf(`id="${id}"`);
    const end = html.indexOf('<h2', start);
    assert.ok(start >= 0 && end > start, id);
    return html.slice(start, end);
  };
  const shows = (part, file) => part.includes(`/till/${file}`) || part.includes(`%2Ftill%2F${file}`);
  for (const [id, name] of [['take-payment', 'payment'], ['check-the-register-during-the-day', 'cashier']]) {
    for (const scheme of ['light', 'dark']) {
      assert.ok(shows(section(id), `${name}-${scheme}.png`), `${name}-${scheme}`);
      // Round 11, C6: the phone capture is served below 640px.
      const phone = (section(id).match(/<source[^>]*>/g) ?? []).find((s) => shows(s, `${name}-phone-${scheme}.png`));
      assert.ok(phone?.includes('media="(max-width: 639px)"'), `${name}-phone-${scheme}`);
    }
  }
});

test('at the till payment and cashier figures have captions and their real image sizes', () => {
  // Round 15, C5: the wide <img> carries the PNG's own pixel size (IHDR width and height), not a fixed 2880x1800.
  for (const [id, name] of [['take-payment', 'payment'], ['check-the-register-during-the-day', 'cashier']]) {
    const start = html.indexOf(`id="${id}"`);
    const figure = html.slice(html.indexOf('<figure', start), html.indexOf('</figure>', start));
    assert.match(figure, /<figcaption[^>]*>The (payment screen|cashier sheet) on the live demo till\.<\/figcaption>/, name);
    for (const scheme of ['light', 'dark']) {
      const png = readFileSync(`public/till/${name}-${scheme}.png`);
      const img = figure.match(new RegExp(`<img[^>]*%2Ftill%2F${name}-${scheme}\\.png[^>]*>`))?.[0] ?? '';
      assert.ok(img.includes(`width="${png.readUInt32BE(16)}"`) && img.includes(`height="${png.readUInt32BE(20)}"`), `${name}-${scheme}`);
    }
  }
});

test('at the till screenshots are each at most 400 KB', () => {
  for (const file of ['payment-light', 'payment-dark', 'cashier-light', 'cashier-dark', 'payment-phone-light', 'payment-phone-dark', 'cashier-phone-light', 'cashier-phone-dark']) {
    assert.ok(statSync(`public/till/${file}.png`).size <= 400 * 1024, file);
  }
});

test('at the till receipt section names the cash drawer and links limitations', () => {
  // Round 15, C2: vendurepos/app@df046fc lib/sale-receipt.tsx:31 prints with window.print(); nothing opens a drawer.
  const start = html.indexOf('id="receipt-and-next-sale"');
  const end = html.indexOf('<h2', start);
  assert.ok(start >= 0 && end > start);
  const section = html.slice(start, end);
  assert.match(section.replace(/<[^>]+>/g, ''), /does not open the cash drawer, so open it by hand/);
  assert.ok(section.includes('href="/docs/limitations"'));
});

test('at the till says what happens when the internet drops, before closing the day', () => {
  // Round 12, C4: restates troubleshooting.mdx "Sell while offline" and the header line.
  const start = html.indexOf('id="if-the-internet-drops"');
  const end = html.indexOf('id="count-the-drawer-and-close-the-day"');
  assert.ok(start >= 0 && end > start);
  const section = html.slice(start, end);
  assert.match(section, /waiting to send/);
  const anchor = section.match(/href="\/docs\/troubleshooting#([^"]+)"/)?.[1];
  assert.ok(anchor, 'link to a troubleshooting heading');
  const troubleshooting = readFileSync('.next/server/app/docs/troubleshooting.html', 'utf8');
  assert.match(troubleshooting, new RegExp(`<h[1-6][^>]*id="${anchor}"`));
});

test('plugin setup shows how to settle a Dashboard refund; at the till names no TallyPosRefund', () => {
  // Round 19: plugin-v0.3.0 has no TallyPosRefund (git grep prints nothing); Vendure Admin API settleRefund,
  // orders filter on code (plugin-v0.3.0 test/api-key.e2e.ts:49), GraphiqlPlugin route /graphiql/admin.
  // Round 20: the settle steps are an administrator's, so they live on Plugin setup, not the cashier page.
  const setup = readFileSync('.next/server/app/docs/plugin-setup.html', 'utf8');
  const text = setup.replace(/<[^>]+>/g, '');
  for (const words of ['settleRefund(input', 'RefundStateTransitionError', 'refunds { id state total }', '/graphiql/admin']) {
    assert.ok(text.includes(words), words);
  }
  assert.match(setup, /<h2[^>]*id="settle-a-dashboard-refund"/);
  const till = html.replace(/<[^>]+>/g, '');
  assert.ok(!till.includes('settleRefund(input'), 'at the till has no settleRefund mutation');
  assert.doesNotMatch(till, /TallyPosRefund/);
  assert.doesNotMatch(html, /id="settle-a-dashboard-refund"/);
});

test('limitations links settleRefund to the plugin setup steps', () => {
  const limitations = readFileSync('.next/server/app/docs/limitations.html', 'utf8');
  assert.ok(limitations.includes('href="/docs/plugin-setup#settle-a-dashboard-refund"'));
});

test('at the till says unsent sales are lost if site data is cleared or the device is lost', () => {
  // Round 20, J2 C4/C7: limitations.mdx:44-45 was the only page that said so, and "offline" did not find it.
  const start = html.indexOf('id="if-the-internet-drops"');
  const end = html.indexOf('id="count-the-drawer-and-close-the-day"');
  assert.ok(start >= 0 && end > start);
  const section = html.slice(start, end);
  const text = section.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '');
  for (const words of ['offline', 'kept only in this browser', 'device is lost']) {
    assert.ok(text.includes(words), words);
  }
  assert.match(section, /href="\/docs\/limitations(#[^"]+)?"/);
});

test('at the till says to keep the tab open while offline, since a reload needs the connection', () => {
  // Round 28, C3 (J2): the page never said whether a reload works offline.
  const start = html.indexOf('id="if-the-internet-drops"');
  const end = html.indexOf('<h2', start + 1);
  assert.ok(start >= 0 && end > start);
  const text = html
    .slice(start, end)
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ');
  const keepOpen = text.indexOf("Keep the till's tab open while the connection is down");
  assert.ok(keepOpen >= 0, 'keep the tab open');
  assert.ok(text.includes('needs the connection to load the till again'), 'a reload needs the connection');
  const neverTwice = text.indexOf('never twice');
  assert.ok(neverTwice >= 0 && neverTwice < keepOpen, 'after never twice');
  assert.ok(keepOpen < text.indexOf('orders waiting to send'), 'before orders waiting to send');
});

test('at the till says Reports is in the side menu', () => {
  // Round 30, C4 (J2): Reports was named without saying where it is.
  const start = html.indexOf('id="check-the-register-during-the-day"');
  const end = html.indexOf('<h2', start + 1);
  assert.ok(start >= 0 && end > start);
  const text = html
    .slice(start, end)
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ');
  assert.ok(text.includes("Reports, in the till's side menu, opens on the drawer card"), 'Reports is in the side menu');
});

test('at the till says the expected cash also counts pay ins and pay outs', () => {
  // Round 31, C4 (J2): the drawer card line read as float + cash sales = expected, against the refund section's pay ins and pay outs.
  const start = html.indexOf('id="check-the-register-during-the-day"');
  const end = html.indexOf('<h2', start + 1);
  assert.ok(start >= 0 && end > start);
  const text = html
    .slice(start, end)
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ');
  assert.ok(!text.includes('opening float plus cash sales is what is expected'), 'no float + cash sales = expected');
  assert.ok(text.includes('which also counts any pay ins and pay outs'), 'expected cash counts pay ins and pay outs');
});

test('at the till shows the closure screen in the close-the-day section, and Hand over leaves the register open', () => {
  // Round 33, J2 C4: the close-the-day section had no picture of the close screen.
  const start = html.indexOf('id="count-the-drawer-and-close-the-day"');
  const end = html.indexOf('The Z report lists', start);
  assert.ok(start >= 0 && end > start);
  const section = html.slice(start, end);
  const img = section.match(/<img[^>]*alt="The closure on the live demo till[^>]*>/)?.[0];
  assert.ok(img, 'closure img between the h2 and The Z report lists');
  const figure = section.slice(section.lastIndexOf('<figure', section.indexOf(img)), section.indexOf('</figure>', section.indexOf(img)));
  assert.match(figure, /<figcaption[^>]*>The closure screen on the live demo till\.<\/figcaption>/);
  const png = readFileSync('public/till/closure-light.png');
  const wide = figure.match(/<img[^>]*%2Ftill%2Fclosure-light\.png[^>]*>/)?.[0] ?? '';
  assert.ok(wide.includes(`width="${png.readUInt32BE(16)}"`) && wide.includes(`height="${png.readUInt32BE(20)}"`), 'real size');
  const phone = (figure.match(/<source[^>]*>/g) ?? []).find((s) => s.includes('%2Ftill%2Fclosure-phone-light.png'));
  assert.ok(phone?.includes('media="(max-width: 639px)"'), 'phone source');
  const text = html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '');
  assert.ok(text.includes('leaves the register open'), 'register open');
  assert.ok(!text.includes('leaves the drawer open'), 'not drawer open');
});

test('at the till shots are one session: the alts agree on €20.09 and €120.09, and the closure has clear corners', () => {
  // Round 34, J4 C5/C2: the three At the till shots came from different sessions and disagreed.
  const alts = [...html.matchAll(/<img[^>]*\salt="([^"]*)"/g)].map((m) => m[1]);
  for (const alt of alts) {
    for (const bad of ['€21.29', '€121.29', 'Fixture']) assert.ok(!alt.includes(bad), `${bad} in ${alt}`);
  }
  const altOf = (start) => alts.find((alt) => alt.startsWith(start)) ?? '';
  const payment = altOf('The payment screen on the live demo till');
  assert.ok(payment.includes('Total €20.09'), 'payment Total €20.09');
  const cashier = altOf('The cashier sheet on the live demo till');
  assert.ok(cashier.includes('Your sales today €20.09'), 'cashier sales €20.09');
  assert.ok(cashier.includes('In the drawer €120.09'), 'cashier drawer €120.09');
  const closure = altOf('The closure on the live demo till');
  assert.ok(closure.includes('Counted €120.09'), 'closure counted €120.09');
  for (const name of ['closure-light', 'closure-dark', 'closure-phone-light', 'closure-phone-dark']) {
    assert.equal(readFileSync(`public/till/${name}.png`)[25], 6, `${name} is RGBA`);
  }
});

test('at the till narrow shots sit centred on a column-wide panel; the closure has one border', () => {
  // Round 34, J4 C5: three shot widths left-aligned read as unplanned; narrow shots sit centred on a column-wide panel.
  const figureIn = (id) => {
    const start = html.indexOf(`id="${id}"`);
    assert.ok(start >= 0, id);
    const open = html.indexOf('<figure', start);
    return html.slice(open, html.indexOf('</figure>', open));
  };
  const imgOf = (figure, file) => figure.match(new RegExp(`<img[^>]*%2Ftill%2F${file}[^>]*>`))?.[0] ?? '';
  for (const [id, name] of [['check-the-register-during-the-day', 'cashier'], ['count-the-drawer-and-close-the-day', 'closure']]) {
    const figure = figureIn(id);
    const panel = figure.match(/<div class="([^"]*)"( style="[^"]*")?>/);
    assert.ok(panel?.[1].includes('sm:bg-fd-muted') && panel[1].includes('sm:justify-center'), `${name} panel`);
    const inside = figure.slice(panel.index, figure.lastIndexOf('</div>'));
    for (const scheme of ['light', 'dark']) assert.ok(imgOf(inside, `${name}-${scheme}.png`), `${name}-${scheme} inside the panel`);
    assert.match(imgOf(figure, `${name}-light.png`), /class="[^"]*\bmx-auto\b/, `${name} img centred in its picture`);
  }
  assert.ok(!figureIn('take-payment').includes('sm:bg-fd-muted'), 'payment has no panel');
  assert.doesNotMatch(imgOf(figureIn('take-payment'), 'payment-light.png'), /mx-auto/, 'payment img not centred');
  assert.ok(imgOf(figureIn('take-payment'), 'payment-light.png'), 'payment light img found');
  assert.ok(!imgOf(figureIn('count-the-drawer-and-close-the-day'), 'closure-light.png').includes('border-fd-border'), 'closure has one border');
  assert.match(imgOf(figureIn('check-the-register-during-the-day'), 'cashier-light.png'), /class="[^"]*border-fd-border/, 'cashier keeps its border');
  const home = readFileSync('.next/server/app/index.html', 'utf8');
  const sale = (home.match(/<figure[\s\S]*?<\/figure>/g) ?? []).find((f) => f.includes('%2Ftill%2Fsale-light.png'));
  assert.ok(sale && !sale.includes('sm:bg-fd-muted'), 'home sale has no panel');
});

test('at the till narrow panels hug their shots', () => {
  // Round 36, J2/J4 C5: column-wide panels left the narrow shots small in empty grey.
  for (const [id, name, max] of [['check-the-register-during-the-day', 'cashier', 418], ['count-the-drawer-and-close-the-day', 'closure', 546]]) {
    const start = html.indexOf(`id="${id}"`);
    assert.ok(start >= 0, id);
    const figure = html.slice(html.indexOf('<figure', start), html.indexOf('</figure>', start));
    const panel = figure.match(/<div class="([^"]*)" style="([^"]*)">/);
    assert.ok(panel, `${name} panel`);
    const classes = panel[1].split(' ');
    assert.ok(classes.includes('sm:mx-auto') && classes.includes('sm:p-4') && !classes.includes('sm:p-8'), `${name} panel classes`);
    assert.match(panel[2], new RegExp(`max-width:${max}px`), `${name} panel max-width`);
  }
});

// Round 35, J2 C4/C6: the offline section was one paragraph with its warning buried mid-way.
test('at the till sets the offline warning apart and lists what still needs the connection', () => {
  const frame = 'rounded-xl border bg-fd-card';
  const start = html.indexOf('id="if-the-internet-drops"');
  const end = html.indexOf('id="count-the-drawer-and-close-the-day"', start);
  assert.ok(start >= 0 && end > start);
  const section = html.slice(start, end).replace(/\s+/g, ' ');
  const lists = section.match(/<ul/g) ?? [];
  assert.equal(lists.length, 1, 'one list');
  const ul = section.indexOf('<ul');
  const listText = section.slice(ul, section.indexOf('</ul>', ul)).replace(/<[^>]+>/g, '');
  for (const words of ['Customer search', 'orders waiting to send']) assert.ok(listText.includes(words), words);
  const keepTill = section.indexOf('Keep the till');
  const frameStart = section.lastIndexOf(frame, keepTill);
  assert.ok(keepTill >= 0 && frameStart >= 0, 'callout frame before Keep the till');
  // The warn variant: the style the quick-start warn callout carries and its plain "Try it first" callout lacks.
  const quickStart = readFileSync('.next/server/app/docs/quick-start.html', 'utf8');
  const styleOf = (page, text) => {
    const at = page.lastIndexOf(frame, page.indexOf(text));
    return page.slice(at, page.indexOf('>', at)).match(/style="([^"]*)"/)?.[1] ?? '';
  };
  const warn = styleOf(quickStart, 'Before a sale on a live store');
  assert.match(warn, /warning/, 'quick-start warn callout names a warning colour');
  assert.ok(!styleOf(quickStart, 'Try it first').includes(warn), 'a plain callout does not carry it');
  assert.ok(styleOf(section, 'Keep the till') === warn, 'offline callout is the warn variant');
  const reload = section.indexOf('needs the connection to load the till again');
  assert.ok(frameStart < reload && reload < ul, 'reload sentence inside the callout, before the list');
});

test('the header notice is a code pill wherever the docs name it', () => {
  // Round 37, J4 C4: the notice was bold in one place and a code pill in the next.
  const notice = 'orders waiting to send';
  const encloses = (page, at, open, close) => {
    const opened = page.lastIndexOf(open, at);
    return opened >= 0 && page.lastIndexOf(close, at) < opened;
  };
  for (const name of ['at-the-till', 'limitations', 'troubleshooting']) {
    // The rendered markup only: the RSC payload in <script> repeats the text as JSON, with no <code tag.
    const page = readFileSync(`.next/server/app/docs/${name}.html`, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
    let count = 0;
    for (let at = page.indexOf(notice); at >= 0; at = page.indexOf(notice, at + notice.length)) {
      count += 1;
      assert.ok(encloses(page, at, '<code', '</code>'), `${name} occurrence ${count} inside <code>`);
      assert.ok(!encloses(page, at, '<strong', '</strong>'), `${name} occurrence ${count} not inside <strong>`);
    }
    assert.ok(count >= 1, `${name} names the notice`);
  }
});
