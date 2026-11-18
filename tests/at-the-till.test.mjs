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
  assert.match(section, /need a plugin release after 0\.3\.0/);
  assert.match(section, /On plugin 0\.3\.0, refund in the Vendure Dashboard/);
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
