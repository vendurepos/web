import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../lib/site.ts';

test('built llms.txt names the product, summarises it and links absolutely', () => {
  const body = readFileSync('.next/server/app/llms.txt.body', 'utf8');
  const lines = body.split('\n');
  assert.equal(lines[0], `# ${SITE_NAME}`);
  assert.equal(lines[2], `> ${SITE_DESCRIPTION}`);

  const links = [...body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
  const meta = JSON.parse(readFileSync(new URL('../content/docs/meta.json', import.meta.url), 'utf8'));
  assert.equal(links.length, meta.pages.length + 2);
  for (const link of links) {
    assert.ok(link.startsWith(`${SITE_URL}/`), link);
  }
  assert.ok(links.includes(`${SITE_URL}/`));
  assert.ok(links.includes(`${SITE_URL}/llms-full.txt`));
});

test('built llms text shows each till figure as a Markdown image, not a raw component', () => {
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const file of ['llms-full.txt.body', 'llms.mdx/docs/at-the-till.body']) {
    const body = readFileSync(`.next/server/app/${file}`, 'utf8');
    assert.ok(!body.includes('<TillFigure'), file);
    for (const [name, alt] of [['payment', 'The payment screen on the live demo till'], ['cashier', 'The cashier sheet on the live demo till']]) {
      const image = `!\\[${escape(alt)}[^\\]\\n]*\\]\\(${escape(`${SITE_URL}/till/${name}-light.png`)}\\)`;
      assert.match(body, new RegExp(image), `${file} ${name}`);
    }
  }
});

test('built llms text has no raw Cards or Callouts, and every link in it is absolute', () => {
  const full = readFileSync('.next/server/app/llms-full.txt.body', 'utf8');
  for (const raw of ['<Cards', '<Card ', '</Card>', '<Callout', '</Callout>', '](/', '](#']) {
    assert.ok(!full.includes(raw), raw);
  }
  assert.ok(full.includes('- [Live demo](https://demo.vendurepos.com/demo): '));
  assert.match(full, /^> \*\*Try it first:\*\*/m);
  assert.ok(full.includes(`URL: ${SITE_URL}/docs/quick-start`));

  const page = readFileSync('.next/server/app/llms.mdx/docs/connect-a-till.body', 'utf8');
  assert.equal(page.split('\n').filter((line) => line.trim())[1], `URL: ${SITE_URL}/docs/connect-a-till`);
});

test('built llms text has no raw div wrapper and no line of raw JSX or HTML outside code blocks', () => {
  const dir = '.next/server/app/llms.mdx/docs';
  const pages = readdirSync(dir).filter((f) => f.endsWith('.body')).map((f) => `llms.mdx/docs/${f}`);
  for (const file of ['llms-full.txt.body', ...pages]) {
    const body = readFileSync(`.next/server/app/${file}`, 'utf8');
    assert.ok(!body.includes('<div') && !body.includes('</div'), file);
    // Fenced code blocks may legitimately show markup, so they are cut out before the line check.
    const prose = body.replace(/^[ \t]*```[\s\S]*?^[ \t]*```/gm, '');
    assert.doesNotMatch(prose, /^[ \t]*<\/?[A-Za-z]/m, file);
  }
});

test('llms.txt and llms-full.txt list the docs in sidebar order (round 91, J1 and J4 C7)', () => {
  const meta = JSON.parse(readFileSync(new URL('../content/docs/meta.json', import.meta.url), 'utf8'));
  const expected = meta.pages.map((slug) => slug === 'index' ? `${SITE_URL}/docs` : `${SITE_URL}/docs/${slug}`);
  const body = readFileSync('.next/server/app/llms.txt.body', 'utf8');
  const links = [...body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]).filter((url) => url.startsWith(`${SITE_URL}/docs`));
  assert.deepEqual(links, expected);
  const full = readFileSync('.next/server/app/llms-full.txt.body', 'utf8');
  const urls = full.split('\n').filter((line) => line.startsWith('URL: ')).map((line) => line.slice(5));
  assert.deepEqual(urls, expected);
});
