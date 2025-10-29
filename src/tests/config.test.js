const { test } = require('node:test');
const assert = require('node:assert');
const { getVariablePattern } = require('../utils/config');

test('getVariablePattern returns default pattern when not set', () => {
  const settings = {};
  const pattern = getVariablePattern(settings);
  assert.deepStrictEqual(pattern, ['{{', '}}']);
});

test('getVariablePattern returns custom pattern when set', () => {
  const settings = {
    'plugin.inlang.i18next': {
      variableReferencePattern: ['[', ']']
    }
  };
  const pattern = getVariablePattern(settings);
  assert.deepStrictEqual(pattern, ['[', ']']);
});

test('getVariablePattern returns default when plugin not present', () => {
  const settings = {
    otherPlugin: {}
  };
  const pattern = getVariablePattern(settings);
  assert.deepStrictEqual(pattern, ['{{', '}}']);
});