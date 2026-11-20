import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

// Round 11: judges read the text-only home card as a generated default; app/opengraph-image.tsx now shows the till.
test('the home share card is a 1200x630 PNG that carries the till screenshot', () => {
  const card = readFileSync('.next/server/app/opengraph-image.body');
  assert.equal(card.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(card.subarray(12, 16).toString('ascii'), 'IHDR');
  assert.deepEqual([card.readUInt32BE(16), card.readUInt32BE(20)], [1200, 630]);
  // The old text-only card was 39,913 bytes; flat text compresses that small, a photo of the till does not (91 KB).
  assert.ok(card.length > 70_000, `card is ${card.length} bytes`);
});

// Round 59 (J5, C5): the card's bottom edge cut through the cart's 'Add charge' button and read as clipped.
function decodePng(png) {
  const [width, height, depth, type] = [png.readUInt32BE(16), png.readUInt32BE(20), png[24], png[25]];
  assert.ok(depth === 8 && (type === 2 || type === 6), `unsupported PNG: bit depth ${depth}, colour type ${type}`);
  const bpp = type === 6 ? 4 : 3;
  const idat = [];
  for (let at = 8; at < png.length; at += 12 + png.readUInt32BE(at)) {
    if (png.toString('ascii', at + 4, at + 8) === 'IDAT') idat.push(png.subarray(at + 8, at + 8 + png.readUInt32BE(at)));
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    assert.ok(filter <= 4, `unknown PNG filter ${filter} on row ${y}`);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? px[y * stride + i - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * stride + i] : 0;
      const c = i >= bpp && y > 0 ? px[(y - 1) * stride + i - bpp] : 0;
      const [pa, pb, pc] = [Math.abs(b - c), Math.abs(a - c), Math.abs(a + b - 2 * c)];
      const paeth = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      px[y * stride + i] = (raw[y * (stride + 1) + 1 + i] + [0, a, b, (a + b) >> 1, paeth][filter]) & 0xff;
    }
  }
  return (x, y) => [...px.subarray(y * stride + x * bpp, y * stride + x * bpp + 3)];
}

test('the home share card crops the till in the gap below Order discount', () => {
  const pixel = decodePng(readFileSync('.next/server/app/opengraph-image.body'));
  // The cart column's buttons span x 860-949 in card pixels ('Order discount' 860-949, 'Add charge' 860-933), measured.
  const xs = Array.from({ length: 949 - 860 + 1 }, (_, i) => 860 + i);
  const dark = xs.filter((x) => pixel(x, 629).some((v) => v < 245));
  assert.deepEqual(dark, [], `bottom row y 629 is not light at x ${dark.slice(0, 5).join(', ')}: it cuts through a button`);
  // A button border row is dark across 866-943 and light across 960-1000; a cart divider runs the full column width.
  const span = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const borders = span(570, 628).filter(
    (y) => span(866, 943).every((x) => pixel(x, y).some((v) => v < 245)) && span(960, 1000).every((x) => pixel(x, y).every((v) => v >= 245)),
  );
  assert.ok(borders.some((top) => borders.some((bottom) => bottom - top >= 20 && bottom - top <= 34)), "'Order discount' is not fully on the card");
});
