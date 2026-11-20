import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('.next/server/app/docs/troubleshooting.html', 'utf8');

const section = (id, nextId) => {
  const start = html.indexOf(`id="${id}"`);
  const end = html.indexOf(`id="${nextId}"`, start);
  assert.ok(start >= 0 && end > start, id);
  return html.slice(start, end);
};

// Round 13, C4: the till updates line told the store owner to ask the store owner.
test('troubleshooting says "Ask the store owner" only inside the quoted notice', () => {
  const notices = section('act-on-a-header-notice', 'refresh-prices-and-stock');
  assert.equal(notices.match(/Ask the store owner/g)?.length, 1);
  assert.match(notices, /“[^”]*Ask the store owner[^”]*”|"[^"]*Ask the store owner[^"]*"|&quot;[^&]*Ask the store owner/);
});

test('troubleshooting sends the owner to Settings and the sync log for refused till updates', () => {
  const owner = section('for-the-store-owner', 'for-whoever-runs-your-vendure-server');
  assert.match(owner, /<strong>Settings<\/strong>/);
  assert.match(owner, /<strong>Sync log<\/strong>/);
  assert.match(owner, /status=rejected/);
});

test('troubleshooting places Retry in Orders and Send again in the header', () => {
  assert.match(html, /<strong>Needs attention<\/strong>\s*in Orders, with a <strong>Retry<\/strong>/);
  assert.match(html, /<strong>Send again<\/strong> on this header line/);
});

// Round 14, C4 (J3): partial-sale recovery gave no runnable listing query and no way to choose a resolution.
test('troubleshooting lists kept sales before resolving one, and says when to choose each resolution', () => {
  const kept = section('resolve-a-sale-the-store-kept-part-way', 'fix-cors-401-or-plain-http-store-problems');
  const blocks = kept.match(/<pre[\s\S]*?<\/pre>/g) ?? [];
  const text = (block) => block.replace(/<[^>]+>/g, '');
  const list = blocks.findIndex((block) => /tallyNeedsAdminCommands/.test(text(block)) && /orderCode/.test(text(block)));
  const resolve = blocks.findIndex((block) => /tallyResolveNeedsAdmin/.test(text(block)));
  assert.ok(list >= 0 && resolve > list, `list ${list}, resolve ${resolve}`);
  const prose = kept.replace(/<pre[\s\S]*?<\/pre>/g, '');
  assert.match(prose, /Choose <code[^>]*>applied<\/code>/);
  assert.match(prose, /Choose <code[^>]*>rejected<\/code>/);
});

// Round 22, C4 (J3): a refused till update had no way to find its log line and no next step.
test('troubleshooting says how to find a refused till update and what can and cannot clear it', () => {
  const owner = section('for-the-store-owner', 'for-whoever-runs-your-vendure-server');
  const counter = section('when-till-updates-need-attention', 'store-settings');
  for (const phrase of [
    'choose <strong>All</strong>',
    'Warnings and errors</strong> does not show',
    'status=rejected',
    'register_session_already_open',
    'Choose another register',
    'register_closure_number_invalid',
    'never sent again',
  ]) {
    assert.ok(owner.includes(phrase), phrase);
  }
  assert.ok(counter.includes('Do not clear the site'));
  assert.ok(!counter.includes('Take over'));
  assert.ok(!owner.includes('Take over'));
});

// Round 22, C4 (J2): the partial-sale section never said who it is for.
test('troubleshooting puts the partial-sale section under the server heading (round 94, J2 C4)', () => {
  const server = html.indexOf('id="for-whoever-runs-your-vendure-server"');
  const kept = html.indexOf('id="resolve-a-sale-the-store-kept-part-way"');
  const cors = html.indexOf('id="fix-cors-401-or-plain-http-store-problems"');
  assert.ok(server >= 0 && kept > server && cors > kept, `${server} ${kept} ${cors}`);
});

// Round 25, C4 (J2): the refused till updates notice went straight to a developer procedure.
test('troubleshooting says what to do at the counter before the sync log procedure', () => {
  const counter = section('when-till-updates-need-attention', 'store-settings');
  const text = counter.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.ok(text.includes('do not reload it'));
  assert.ok(text.includes('sales already made still send to the store'));
  assert.ok(!text.includes('keep selling'));
  assert.ok(counter.includes('href="#for-the-store-owner"'));
  const attention = html.indexOf('id="when-till-updates-need-attention"');
  const owner = html.indexOf('id="for-the-store-owner"');
  assert.ok(attention >= 0 && owner > attention, `${attention} ${owner}`);
});

// Round 26, C4 (J4, J2): the refused till updates item mixed the counter, the owner and a stray note in one paragraph.
test('troubleshooting gives the counter and the store owner their own paragraphs for refused till updates', () => {
  const counter = section('when-till-updates-need-attention', 'store-settings');
  const owner = section('for-the-store-owner', 'for-whoever-runs-your-vendure-server');
  for (const [item, label] of [[counter, 'Leave the app open'], [owner, 'When the header shows']]) {
    const at = item.indexOf(label);
    assert.ok(at >= 0, label);
    assert.match(item.slice(0, at), /<p(\s[^>]*)?>\s*$/, `${label} starts its own paragraph`);
  }
  const leave = counter.indexOf('Leave the app open');
  const clear = counter.indexOf('Do not clear the site');
  assert.ok(leave >= 0 && clear > leave, `${leave} ${clear}`);
  for (const item of [counter, owner]) {
    assert.ok(!item.includes('<strong>At the counter:</strong>'));
    assert.ok(!item.includes('<strong>For the store owner:</strong>'));
  }
});

// Round 27, C4 (J2): the store owner's paragraph went straight into the DEBUG line format with no plain step.
test('troubleshooting gives the store owner a plain step before the sync log procedure', () => {
  const owner = section('for-the-store-owner', 'for-whoever-runs-your-vendure-server')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const find = owner.indexOf('To find the line in the sync log');
  assert.ok(find >= 0, 'To find the line in the sync log');
  for (const phrase of [
    'copy the refused line',
    'choosing another register',
    'fixes by itself',
    'send the copied line to whoever runs your Vendure server',
  ]) {
    const at = owner.indexOf(phrase);
    assert.ok(at >= 0, phrase);
    assert.ok(at < find, `${phrase} comes before To find the line`);
  }
});

// Round 28, C4 (J2): the sync-log procedure folds; the plain step and the errorCode list stay open.
test('troubleshooting folds the sync log procedure inside the till updates item', () => {
  const owner = section('for-the-store-owner', 'for-whoever-runs-your-vendure-server');
  const end = owner.indexOf('register_session_already_open');
  assert.ok(end > 0, `${end}`);
  const item = owner.slice(0, end);
  const opens = item.match(/<details\b[^>]*>/g) ?? [];
  assert.equal(opens.length, 1, 'exactly one <details>');
  assert.doesNotMatch(opens[0], /\sopen\b/, 'the fold starts closed');
  const detailsStart = item.indexOf('<details');
  const detailsEnd = item.indexOf('</details>', detailsStart);
  assert.ok(detailsStart > 0, 'owner text comes before the fold');
  assert.ok(detailsEnd > detailsStart, 'register_session_already_open comes after </details>');
  assert.ok(!item.slice(0, detailsEnd).includes('</li>'), 'the fold sits in the same <li>');
  const details = item.slice(detailsStart, detailsEnd);
  const summary = details.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/);
  assert.ok(summary, '<summary>');
  assert.equal(summary[1].replace(/<[^>]+>/g, '').trim(), 'To find the line in the sync log');
  for (const phrase of ['DEBUG', 'status=rejected', 'last 500 events']) {
    assert.ok(details.includes(phrase), `${phrase} inside the fold`);
  }
});

// Round 47, J2 C2: Troubleshooting's offline answer carries the keep-the-tab-open caveat, like Limitations.
test('sell while offline says to keep the till tab open', () => {
  const start = html.indexOf('id="sell-while-offline"');
  const end = html.indexOf('<h2', start);
  assert.ok(start >= 0 && end > start, `${start} ${end}`);
  const slice = html.slice(start, end);
  const text = slice
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ');
  assert.ok(text.includes('keeps selling offline while its tab stays open'), 'keeps selling offline');
  assert.ok(
    text.includes("Don't reload or close the till's tab until the connection is back"),
    "Don't reload or close the till's tab",
  );
  assert.ok(!text.includes('everything at the till works offline'), 'no everything works offline');
  assert.ok(slice.includes('href="/docs/at-the-till#if-the-internet-drops"'), 'links At the till');
});

test('troubleshooting gives refused till updates their own section after the till updates list (round 74, J4 C4)', () => {
  const header = html.indexOf('id="act-on-a-header-notice"');
  const orders = html.indexOf('id="orders-line"');
  const till = html.indexOf('id="till-updates-line"');
  const attention = html.indexOf('id="when-till-updates-need-attention"');
  const settings = html.indexOf('id="store-settings"');
  const refresh = html.indexOf('id="refresh-prices-and-stock"');
  assert.ok(header >= 0 && orders > header && till > orders && attention > till && settings > attention && refresh > settings);

  const updates = html.slice(till, attention);
  assert.ok(updates.includes('till updates waiting to sync'));
  assert.ok(!updates.includes('need attention'));

  const refused = html.slice(attention, settings);
  for (const phrase of [
    'Ask the store owner',
    'Leave the app open',
    'href="#for-the-store-owner"',
  ]) {
    assert.ok(refused.includes(phrase), phrase);
  }
  assert.ok(!refused.includes('register_session_already_open'));
  assert.ok(!refused.includes('errorCode'));
  assert.ok(!refused.slice(0, refused.indexOf('Leave the app open')).includes('<li'));
});

test('troubleshooting groups its sections by audience (round 94, J2 C4)', () => {
  const ids = [
    'at-the-counter',
    'check-whether-a-sale-has-reached-the-store',
    'act-on-a-header-notice',
    'refresh-prices-and-stock',
    'sell-while-offline',
    'check-browser-storage',
    'for-the-store-owner',
    'for-whoever-runs-your-vendure-server',
    'resolve-a-sale-the-store-kept-part-way',
    'fix-cors-401-or-plain-http-store-problems',
  ];
  let previous = -1;
  for (const id of ids) {
    const at = html.indexOf(`id="${id}"`);
    assert.ok(at > previous, `${id} appears in order`);
    previous = at;
  }
  for (const id of ['at-the-counter', 'for-the-store-owner', 'for-whoever-runs-your-vendure-server']) {
    assert.match(html, new RegExp(`<h2\\b[^>]*\\bid="${id}"`));
  }
  assert.match(html, /<h3\b[^>]*\bid="act-on-a-header-notice"/);
  const owner = html.indexOf('id="for-the-store-owner"');
  for (const term of ['errorCode', 'tallyNeedsAdminCommands', 'VENDUREPOS_WEB_ALLOW_LAN_HTTP']) {
    assert.ok(html.indexOf(term) > owner, `${term} first appears after the owner heading`);
  }
});
