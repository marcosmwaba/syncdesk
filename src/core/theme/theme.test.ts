import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextThemePreference, resolveTheme } from './theme';

test('resolveTheme resolves light, dark, and system preferences accurately', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
});

test('getNextThemePreference toggles cleanly between dark and light', () => {
  assert.equal(getNextThemePreference('light'), 'dark');
  assert.equal(getNextThemePreference('dark'), 'light');
});
