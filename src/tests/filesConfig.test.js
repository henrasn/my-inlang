const { test } = require('node:test');
const assert = require('node:assert');
const { androidFiles, iosFiles } = require('../utils/filesConfig');

test('androidFiles contains expected files', () => {
  assert.deepStrictEqual(androidFiles, ['android', 'be-message', 'main']);
});

test('iosFiles contains expected files', () => {
  assert.deepStrictEqual(iosFiles, ['ios', 'be-message', 'main']);
});