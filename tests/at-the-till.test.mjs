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
    for (const scheme of ['light', 'dark']) assert.ok(shows(section(id), `${name}-${scheme}.png`), `${name}-${scheme}`);
  }
});

test('at the till screenshots are each at most 400 KB', () => {
  for (const file of ['payment-light', 'payment-dark', 'cashier-light', 'cashier-dark']) {
    assert.ok(statSync(`public/till/${file}.png`).size <= 400 * 1024, file);
  }
});
