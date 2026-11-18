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
