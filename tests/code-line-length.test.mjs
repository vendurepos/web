import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('site-owned docs code lines fit 80 columns', () => {
  const files = [
    'content/docs/plugin-setup.mdx',
    'content/docs/connect-a-till.mdx',
    'content/docs/troubleshooting.mdx',
  ];
  const violations = [];
  for (const file of files) {
    let inCodeBlock = false;
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      if (line.trimStart().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      } else if (inCodeBlock && line.length > 80) {
        violations.push(`${file}:${index + 1}: ${line.length} characters`);
      }
    }
  }
  assert.equal(violations.length, 0, violations.join('\n'));
});
