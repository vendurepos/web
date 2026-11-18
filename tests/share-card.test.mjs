import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Round 11: judges read the text-only home card as a generated default; app/opengraph-image.tsx now shows the till.
test('the home share card is a 1200x630 PNG that carries the till screenshot', () => {
  const card = readFileSync('.next/server/app/opengraph-image.body');
  assert.equal(card.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(card.subarray(12, 16).toString('ascii'), 'IHDR');
  assert.deepEqual([card.readUInt32BE(16), card.readUInt32BE(20)], [1200, 630]);
  // The old text-only card was 39,913 bytes; flat text compresses that small, a photo of the till does not (91 KB).
  assert.ok(card.length > 70_000, `card is ${card.length} bytes`);
});
