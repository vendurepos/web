import test from 'node:test';
import assert from 'node:assert/strict';
import { INTERACTION_EVENTS, isUserInteraction } from '../components/analytics-interaction.ts';

test('only pointerdown, keydown and touchstart are listened for', () => {
  assert.deepEqual(INTERACTION_EVENTS, ['pointerdown', 'keydown', 'touchstart']);
});

test('trusted pointerdown, keydown and touchstart are user interactions', () => {
  for (const type of ['pointerdown', 'keydown', 'touchstart']) {
    assert.equal(isUserInteraction({ type, isTrusted: true }), true, type);
  }
});

test('trusted scroll, wheel and pointermove are not user interactions', () => {
  for (const type of ['scroll', 'wheel', 'pointermove']) {
    assert.equal(isUserInteraction({ type, isTrusted: true }), false, type);
  }
});

test('script-dispatched events are not user interactions', () => {
  for (const type of ['pointerdown', 'keydown', 'touchstart', 'scroll']) {
    assert.equal(isUserInteraction({ type, isTrusted: false }), false, type);
  }
});
