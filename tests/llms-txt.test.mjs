import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
