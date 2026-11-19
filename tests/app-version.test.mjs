// Round 37, J5 C4 and desk ruling P6 (c): the hosted till's version, read from its real build.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { appVersionSentence, LOCAL_APP_VERSION, parseAppVersion } from '../lib/app-version.ts';

// Round 39, C2/C4 (J1, J2, J4): the sentence tells the till app's version from the plugin's.
const SENTENCE =
  "The hosted till at app.vendurepos.com is till app version 0.1.0, built 18 Nov 2026 from vendurepos/app commit 8483714. The till app has its own version number; the releases below are the plugin's.";

test('parseAppVersion accepts the local fixture as an equal object', () => {
  assert.deepEqual(parseAppVersion({ ...LOCAL_APP_VERSION }), LOCAL_APP_VERSION);
});

test('parseAppVersion refuses anything but the exact shape', () => {
  const { builtAt: _, ...missing } = LOCAL_APP_VERSION;
  const bad = [
    null,
    'version 0.1.0',
    [LOCAL_APP_VERSION],
    missing,
    { ...LOCAL_APP_VERSION, extra: 'x' },
    ...['v0.1.0', '<b>1</b>', '', 1].map((version) => ({ ...LOCAL_APP_VERSION, version })),
    ...[null, '8483714', LOCAL_APP_VERSION.commit.toUpperCase(), 'g'.repeat(40)].map((commit) => ({ ...LOCAL_APP_VERSION, commit })),
    ...['yesterday', '2026-13-45T99:99Z', ''].map((builtAt) => ({ ...LOCAL_APP_VERSION, builtAt })),
  ];
  for (const value of bad) {
    assert.equal(parseAppVersion(value), null, JSON.stringify(value));
  }
});

test('appVersionSentence names the version, the UTC build date and the short commit', () => {
  assert.equal(appVersionSentence(LOCAL_APP_VERSION), SENTENCE);
});

test('the built changelog shows the hosted till sentence once', () => {
  const html = readFileSync('.next/server/app/docs/changelog.html', 'utf8');
  // The RSC payload in <script> repeats the page's text, so it is cut out before counting what renders.
  const text = html
    .replace(/<script\b[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replaceAll('&#x27;', "'");
  assert.equal(text.split(SENTENCE).length - 1, 1);
});

test('the component reads the real build on Vercel, with a timeout, hourly, validated and as text', () => {
  const source = readFileSync('components/hosted-till-version.tsx', 'utf8');
  for (const needle of ['process.env.VERCEL', 'AbortSignal.timeout(', 'revalidate: 3600', 'parseAppVersion(']) {
    assert.ok(source.includes(needle), needle);
  }
  assert.ok(!source.includes('dangerouslySetInnerHTML'));
});
