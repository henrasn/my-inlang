const { test } = require('node:test');
const assert = require('node:assert');
const { groupPlurals, reverseParseValue } = require('../platforms/android/parsers');

const androidOptions = {
  platform: 'android',
  variablePattern: ['{{', '}}'],
  numericHints: ['count'],
  pluralVariableCandidates: ['count']
};

test('groupPlurals formats simple placeholders for android', () => {
  const { strings } = groupPlurals({ greeting: 'Hello {{name}}' }, androidOptions);
  assert.strictEqual(strings.greeting.value, 'Hello %1$s');
});

test('groupPlurals reuses placeholder indices for repeated variables', () => {
  const { strings } = groupPlurals(
    { sentence: '{{name}} and {{name}}' },
    androidOptions
  );
  assert.strictEqual(strings.sentence.value, '%1$s and %1$s');
});

test('groupPlurals formats numeric placeholders on android', () => {
  const { strings } = groupPlurals(
    {
      countOnly: '{{count, number}}',
      price: 'IDR{{price, number(minimumFractionDigits: 2)}}'
    },
    androidOptions
  );
  assert.strictEqual(strings.countOnly.value, '%1$d');
  assert.strictEqual(strings.price.value, 'IDR%1$.2f');
});

test('reverseParseValue converts android placeholders back to i18next', () => {
  assert.strictEqual(reverseParseValue('Hello %1$s', 'android', false), 'Hello {{val0}}');
  assert.strictEqual(reverseParseValue('%1$d items', 'android', true), '{{count}} items');
  assert.strictEqual(reverseParseValue('%1$d items', 'android', false), '{{val0, number}} items');
  assert.strictEqual(reverseParseValue('Price: %1$.2f', 'android', false), 'Price: {{val0, number(minimumFractionDigits: 2)}}');
});