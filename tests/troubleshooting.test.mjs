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
