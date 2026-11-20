import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const site = readFileSync('lib/site.ts', 'utf8');
const match = site.match(/export const PLUGIN_VERSION = '(\d+\.\d+\.\d+)';/);
assert.ok(match);
const version = match[1];

test('home badge shows the plugin version', () => {
  const html = readFileSync(join('.next/server/app', 'index.html'), 'utf8');
  assert.ok(html.includes(`Pre-release · plugin ${version}`));
});

test('quick start and plugin setup install the plugin version', () => {
  for (const file of ['quick-start.mdx', 'plugin-setup.mdx']) {
    const text = readFileSync(join('content/docs', file), 'utf8');
    const installs = Array.from(text.matchAll(/@vendurepos\/plugin@(\d+\.\d+\.\d+)/g), ([, installed]) => installed);
    assert.ok(installs.length > 0, `${file} has an install version`);
    for (const installed of installs) assert.equal(installed, version, file);
    assert.ok(text.includes(`plugin-v${version}`), `${file} cites the tag`);
  }
});

test('no page says the plugin is not on npm', () => {
  const directory = 'content/docs';
  const files = readdirSync(directory).filter((file) => file.endsWith('.mdx'));
  for (const file of [...files.map((name) => join(directory, name)), 'app/(home)/page.tsx']) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /not yet on npm/i, file);
    if (file !== join(directory, 'changelog.mdx') && file.endsWith('.mdx')) {
      assert.ok(!text.includes('@0.1.0'), `${file} has no old install version`);
    }
  }
});
