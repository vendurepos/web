import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

test('hero explains what Try with your store needs', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const note = html.indexOf('Your own store needs the plugin on your Vendure server first');
  const quickStart = html.indexOf('Quick start</a>');
  const heading = html.indexOf('What it does today</h2>');
  assert.ok(note !== -1);
  assert.ok(quickStart !== -1 && note > quickStart);
  assert.ok(heading !== -1 && note < heading);
});

test('hero shows the till, light and dark', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const quickStart = html.indexOf('Quick start</a>');
  const heading = html.indexOf('What it does today</h2>');
  const img = html.search(/<img[^>]*\salt="The VendurePOS till mid-sale/);
  assert.ok(quickStart !== -1);
  assert.ok(img !== -1 && img > quickStart);
  assert.ok(heading !== -1 && img < heading);
  for (const file of ['sale-light', 'sale-dark', 'sale-phone-light', 'sale-phone-dark']) {
    assert.ok(html.includes(`${file}.png`), file);
    assert.ok(existsSync(`public/till/${file}.png`), file);
  }
});

test('hero serves the phone till capture below 640px', () => {
  // Round 11, C6: art direction, one <source media> per scheme pointing at the phone capture.
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const sources = html.match(/<source[^>]*>/g) ?? [];
  for (const scheme of ['light', 'dark']) {
    assert.ok(sources.some((s) => s.includes('media="(max-width: 639px)"') && s.includes(`sale-phone-${scheme}.png`)), scheme);
  }
});

test('phone hero capture is under one phone screen tall', () => {
  // Round 12, C6: captured at 390x664 CSS px, DPR 2, so the cart has no empty band; the <source> carries its height.
  const sources = readFileSync(join('.next/server/app', 'index.html'), 'utf8').match(/<source[^>]*>/g) ?? [];
  for (const scheme of ['light', 'dark']) {
    const png = readFileSync(`public/till/sale-phone-${scheme}.png`);
    const [width, height] = [png.readUInt32BE(16), png.readUInt32BE(20)];
    assert.ok(width === 780 && height <= 1400, `${scheme} ${width}x${height}`);
    assert.ok(sources.some((s) => s.includes(`sale-phone-${scheme}.png`) && s.includes(`height="${height}"`)), scheme);
  }
});

test('hero lede links Vendure to vendure.io', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const h1 = html.indexOf('<h1');
  const figure = html.indexOf('<figure');
  assert.ok(h1 !== -1 && figure > h1);
  const hero = html.slice(h1, figure);
  assert.match(hero, /<a[^>]*\shref="https:\/\/vendure\.io"[^>]*>Vendure<\/a>/);
  const text = hero.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'");
  // Round 15, C1: the hero says what Vendure is, in its own docs' terms (docs.vendure.io);
  // round 27, J4 C1: the definition is an appositive, not a parenthesis.
  assert.ok(text.includes('VendurePOS is an open-source till for Vendure, the open-source headless commerce framework.'));
  assert.ok(text.includes('It runs in the browser and keeps selling when the connection drops.'));
  assert.ok(!text.includes('Every sale lands in your Vendure store once'), 'round 43: the guarantee is on its card, not in the hero');
  const ledeStart = hero.indexOf('<p', hero.indexOf('</h1>'));
  const lede = hero.slice(ledeStart, hero.indexOf('</p>', ledeStart)).replace(/<[^>]+>/g, '');
  assert.ok(ledeStart !== -1 && !lede.includes('('), lede);
});

// Round 42, J1 C1: the hero names who it is for, right after saying what it is.
test('hero lede says who VendurePOS is for', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const h1 = html.indexOf('<h1');
  const figure = html.indexOf('<figure');
  assert.ok(h1 !== -1 && figure > h1);
  const hero = html.slice(h1, figure);
  const text = hero.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'");
  const sentence =
    'framework. It is made for shops that sell online with Vendure and also sell in person. It runs in the browser';
  assert.equal(text.split(sentence).length - 1, 1, text);
});

// Round 43, J4 C1: the lede is three sentences and the guarantee it dropped is still on a feature card.
test('hero lede ends on offline selling and the guarantee stays on its card', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const h1End = html.indexOf('</h1>');
  assert.ok(h1End !== -1);
  const ledeStart = html.indexOf('<p', h1End);
  const ledeEnd = html.indexOf('</p>', ledeStart);
  assert.ok(ledeStart !== -1 && ledeEnd > ledeStart);
  const lede = html
    .slice(ledeStart, ledeEnd)
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;/g, "'")
    .trim();
  assert.ok(lede.endsWith('keeps selling when the connection drops.'), lede);
  const body = html
    .slice(html.indexOf('</head>'))
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/&#x27;/g, "'");
  assert.ok(body.includes('Every sale lands once'), 'replay card');
  assert.ok(body.includes("Paid, fulfilled, at the till"), 'price card');
});

test('hero is left-aligned with a smaller lead below 640px', () => {
  // Round 32, J4 C1: seven centred lines of large grey type on a phone.
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const classes = (tag) => (tag.match(/\sclass="([^"]*)"/)?.[1] ?? '').split(/\s+/);
  const h1 = html.indexOf('<h1');
  assert.ok(h1 !== -1);
  const sectionStart = html.lastIndexOf('<section', h1);
  assert.ok(sectionStart !== -1);
  const section = classes(html.slice(sectionStart, html.indexOf('>', sectionStart) + 1));
  assert.ok(section.includes('text-left') && section.includes('sm:text-center'), section.join(' '));
  assert.ok(!section.includes('text-center'), section.join(' '));
  const ledeStart = html.indexOf('<p', html.indexOf('</h1>', h1));
  assert.ok(ledeStart !== -1);
  const lede = classes(html.slice(ledeStart, html.indexOf('>', ledeStart) + 1));
  assert.ok(lede.includes('text-base') && lede.includes('sm:text-lg'), lede.join(' '));
  assert.ok(!lede.includes('text-lg'), lede.join(' '));
  const demo = html.indexOf('>Live demo</a>', ledeStart);
  const quickStart = html.indexOf('>Quick start</a>', demo);
  assert.ok(demo !== -1 && quickStart > demo);
  const buttonsStart = html.lastIndexOf('<div', demo);
  assert.ok(buttonsStart > ledeStart && html.indexOf('</div>', buttonsStart) > quickStart);
  const buttons = classes(html.slice(buttonsStart, html.indexOf('>', buttonsStart) + 1));
  assert.ok(buttons.includes('justify-start') && buttons.includes('sm:justify-center'), buttons.join(' '));
  assert.ok(!buttons.includes('justify-center'), buttons.join(' '));
});

// Round 33, J4 C6: the phone hero clipped the cart's Add charge at 390x664.
// Round 35, J1/J2/J4/J5 C6: the phone cart truncated its Qty header; the phone hero now shows the Products tab.
test('phone hero capture is the Products tab at 390x665, and its alt names the cart total', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const sources = html.match(/<source[^>]*>/g) ?? [];
  for (const scheme of ['light', 'dark']) {
    const png = readFileSync(`public/till/sale-phone-${scheme}.png`);
    const [width, height] = [png.readUInt32BE(16), png.readUInt32BE(20)];
    assert.ok(width === 780 && height === 1330, `${scheme} ${width}x${height}`);
    assert.ok(sources.some((s) => s.includes(`sale-phone-${scheme}.png`) && s.includes('height="1330"')), scheme);
  }
  const img = html.match(/<img[^>]*\salt="(The VendurePOS till mid-sale[^"]*)"/);
  assert.ok(img, 'hero img');
  assert.ok(img[1].includes('€20.09') && !img[1].includes('€59.59'), img[1]);
});

// Round 35, J4 C5: the desktop hero was cut mid-row.
test('desktop hero capture ends on whole rows at 2880x1732', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const imgs = html.match(/<img[^>]*>/g) ?? [];
  for (const scheme of ['light', 'dark']) {
    const png = readFileSync(`public/till/sale-${scheme}.png`);
    const [width, height] = [png.readUInt32BE(16), png.readUInt32BE(20)];
    assert.ok(width === 2880 && height === 1732, `${scheme} ${width}x${height}`);
    const img = imgs.find((i) => i.includes(`sale-${scheme}.png`) && i.includes('alt="The VendurePOS till mid-sale'));
    assert.ok(img, `hero img ${scheme}`);
    assert.ok(img.includes('width="2880"') && img.includes('height="1732"'), img);
  }
});

// Round 40, J4 C1: the helper note keeps the lede's measure.
test('hero helper note sits on the lede measure', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const classes = (tag) => (tag.match(/\sclass="([^"]*)"/)?.[1] ?? '').split(/\s+/);
  const text = html.indexOf('Your own store needs the plugin on your Vendure server first');
  assert.ok(text !== -1);
  const noteStart = html.lastIndexOf('<p', text);
  const h1End = html.indexOf('</h1>');
  assert.ok(h1End !== -1);
  const ledeStart = html.indexOf('<p', h1End);
  assert.ok(ledeStart !== -1 && noteStart > ledeStart);
  for (const [name, start] of [['note', noteStart], ['lede', ledeStart]]) {
    const cls = classes(html.slice(start, html.indexOf('>', start) + 1));
    assert.ok(cls.includes('max-w-2xl') && cls.includes('mx-auto'), `${name}: ${cls.join(' ')}`);
  }
});

// Round 44, J1 C6 and J2 C6: the phone header keeps a visible Docs link; Fumadocs hides the others below 640px.
test('phone header keeps a visible Docs link on the home page only', () => {
  const anchors = (html) => html.match(/<a\s[^>]*>[\s\S]*?<\/a>/g) ?? [];
  const classes = (tag) => (tag.match(/\sclass="([^"]*)"/)?.[1] ?? '').split(/\s+/);
  const phoneDocs = (a) => /\shref="\/docs"/.test(a) && classes(a.slice(0, a.indexOf('>') + 1)).includes('sm:hidden');
  const home = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  const start = home.search(/<header[^>]*\sid="nd-nav"/);
  assert.ok(start !== -1, 'home header');
  const end = home.indexOf('</header>', start);
  assert.ok(end > start, 'home header end');
  const link = anchors(home.slice(start, end)).find(phoneDocs);
  assert.ok(link, 'phone Docs link in the home header');
  assert.equal(link.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '').trim(), 'Docs');
  const docs = readFileSync(join('.next/server/app', 'docs.html'), 'utf8');
  assert.ok(!anchors(docs).some(phoneDocs), 'docs layout has no phone Docs link');
  // Round 45, J5 C6: Live demo stays visible too.
  const phoneDemo = (a) => /\shref="https:\/\/demo\.vendurepos\.com\/demo"/.test(a) && classes(a.slice(0, a.indexOf('>') + 1)).includes('sm:hidden');
  const demo = anchors(home.slice(start, end)).find(phoneDemo);
  assert.ok(demo, 'phone Live demo link in the home header');
  assert.equal(demo.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '').trim(), 'Live demo');
  assert.ok(!anchors(docs).some(phoneDemo), 'docs layout has no phone Live demo link');
});
