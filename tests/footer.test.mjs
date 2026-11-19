import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Round 55, J5 C6: plain <a> renders href before class, Next <Link> class before href, so class is read anywhere.
const classTokens = (tag) => tag.match(/\sclass="([^"]*)"/)?.[1].split(/\s+/) ?? [];

test('home footer links are 44 px tap targets', () => {
  const html = readFileSync('.next/server/app/index.html', 'utf8');
  const start = html.indexOf('<footer');
  assert.ok(start >= 0, '<footer found');
  const end = html.indexOf('</footer>', start);
  assert.ok(end > start, '</footer> found');
  const footer = html.slice(start, end);
  for (const text of ['GitHub', 'npm', 'Limitations', 'Changelog']) {
    const tag = Array.from(footer.matchAll(/(<a\b[^>]*>)([\s\S]*?)<\/a>/g)).find(([, , inner]) => inner === text)?.[1];
    assert.ok(tag, `${text} link in the footer`);
    for (const token of ['inline-flex', 'min-h-11', 'items-center']) {
      assert.ok(classTokens(tag).includes(token), `${text} link has ${token}`);
    }
  }
  const group = footer.match(/<div\b[^>]*>(?=<a\b[^>]*>GitHub<\/a>)/)?.[0];
  assert.ok(group, 'the links sit in a <div>');
  assert.ok(classTokens(group).includes('gap-x-6'), 'the links group has gap-x-6');
});
