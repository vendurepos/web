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
  const notices = section('act-on-a-header-notice', 'refresh-prices-and-stock');
  const start = notices.indexOf('Till updates line');
  const end = notices.indexOf('Store settings', start);
  assert.ok(start >= 0 && end > start);
  const till = notices.slice(start, end);
  assert.match(till, /<strong>Settings<\/strong>/);
  assert.match(till, /<strong>Sync log<\/strong>/);
  assert.match(till, /status=rejected/);
});

test('troubleshooting places Retry in Orders and Send again in the header', () => {
  assert.match(html, /<strong>Needs attention<\/strong>\s*in Orders, with a <strong>Retry<\/strong>/);
  assert.match(html, /<strong>Send again<\/strong> on this header line/);
});

// Round 14, C4 (J3): partial-sale recovery gave no runnable listing query and no way to choose a resolution.
test('troubleshooting lists kept sales before resolving one, and says when to choose each resolution', () => {
  const kept = section('resolve-a-sale-the-store-kept-part-way', 'check-browser-storage');
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
  const notices = section('act-on-a-header-notice', 'refresh-prices-and-stock');
  for (const phrase of [
    'choose <strong>All</strong>',
    'Warnings and errors</strong> does not show',
    'status=rejected',
    'register_session_already_open',
    'Choose another register',
    'register_closure_number_invalid',
    'never sent again',
    'Do not clear the site',
  ]) {
    assert.ok(notices.includes(phrase), phrase);
  }
  assert.ok(!notices.includes('Take over'));
});

// Round 22, C4 (J2): the partial-sale section never said who it is for.
test('troubleshooting says the partial-sale section is for whoever runs the Vendure server', () => {
  const kept = section('resolve-a-sale-the-store-kept-part-way', 'check-browser-storage');
  const text = kept.slice(kept.indexOf('</h2>')).replace(/<[^>]+>/g, '').trim();
  assert.ok(text.startsWith('This section is for whoever runs your Vendure server.'), text.slice(0, 80));
});

// Round 25, C4 (J2): the refused till updates notice went straight to a developer procedure.
test('troubleshooting says what to do at the counter before the sync log procedure', () => {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const start = text.indexOf('till updates need attention');
  const end = text.indexOf('register_session_already_open', start);
  assert.ok(start >= 0 && end > start);
  const item = text.slice(start, end);
  const counter = item.indexOf('At the counter:');
  const owner = item.indexOf('For the store owner:');
  const log = item.indexOf('Sync log', owner);
  assert.ok(counter >= 0 && owner > counter && log > owner, `${counter} ${owner} ${log}`);
  assert.ok(item.includes('do not reload it'));
  assert.ok(item.includes('sales already made still send to the store'));
  assert.ok(!item.includes('keep selling'));
});

// Round 26, C4 (J4, J2): the refused till updates item mixed the counter, the owner and a stray note in one paragraph.
test('troubleshooting gives the counter and the store owner their own paragraphs for refused till updates', () => {
  const start = html.indexOf('till updates need attention');
  const end = html.indexOf('register_session_already_open', start);
  assert.ok(start >= 0 && end > start);
  const item = html.slice(start, end);
  for (const label of ['<strong>At the counter:</strong>', '<strong>For the store owner:</strong>']) {
    const at = item.indexOf(label);
    assert.ok(at >= 0, label);
    assert.match(item.slice(0, at), /<p(\s[^>]*)?>\s*$/, `${label} starts its own paragraph`);
  }
  const text = item.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const counter = text.indexOf('At the counter:');
  const clear = text.indexOf('Do not clear the site');
  const owner = text.indexOf('For the store owner:');
  assert.ok(counter >= 0 && clear > counter && owner > clear, `${counter} ${clear} ${owner}`);
  const tailStart = html.indexOf('runs your Vendure server.', end);
  const tailEnd = html.indexOf('till updates waiting to sync', tailStart);
  assert.ok(tailStart >= 0 && tailEnd > tailStart);
  // The list is loose, so the next item opens with <li><p>; nothing may sit before that <li.
  const tail = html.slice(tailStart, tailEnd);
  const nextItem = tail.lastIndexOf('<li');
  assert.ok(nextItem >= 0, 'the next item follows');
  assert.ok(!tail.slice(0, nextItem).includes('<p'), 'no paragraph after the Any other code text');
});

// Round 27, C4 (J2): the store owner's paragraph went straight into the DEBUG line format with no plain step.
test('troubleshooting gives the store owner a plain step before the sync log procedure', () => {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const start = text.indexOf('For the store owner:');
  const end = text.indexOf('DEBUG', start);
  assert.ok(start >= 0 && end > start, `${start} ${end}`);
  const owner = text.slice(start, end);
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
  const start = html.indexOf('For the store owner:');
  const end = html.indexOf('register_session_already_open', start);
  assert.ok(start >= 0 && end > start, `${start} ${end}`);
  const item = html.slice(start, end);
  const opens = item.match(/<details\b[^>]*>/g) ?? [];
  assert.equal(opens.length, 1, 'exactly one <details>');
  assert.doesNotMatch(opens[0], /\sopen\b/, 'the fold starts closed');
  const detailsStart = item.indexOf('<details');
  const detailsEnd = item.indexOf('</details>', detailsStart);
  assert.ok(detailsStart > 0, 'For the store owner: comes before the fold');
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
