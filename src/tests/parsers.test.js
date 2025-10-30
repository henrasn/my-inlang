const { test } = require('node:test');
const assert = require('node:assert');
const { groupPlurals, reverseParseValue } = require('../utils/parsers');

const androidOptions = {
  platform: 'android',
  variablePattern: ['{{', '}}'],
  numericHints: ['count'],
  pluralVariableCandidates: ['count']
};

const iosOptions = {
  platform: 'ios',
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

test('groupPlurals formats placeholders for ios', () => {
  const { strings } = groupPlurals({ greeting: 'Hello {{name}}' }, iosOptions);
  assert.strictEqual(strings.greeting.value, 'Hello %1$@');
});

test('groupPlurals marks plural variable for ios plurals', () => {
  const { plurals } = groupPlurals(
    {
      rooms_one: '{{count}} room',
      rooms_other: '{{count}} rooms'
    },
    iosOptions
  );

  assert.strictEqual(plurals.rooms.pluralVariable, 'count');
  assert.strictEqual(plurals.rooms.quantities.one.value, '%#@count@ room');
  assert.strictEqual(plurals.rooms.quantities.other.value, '%#@count@ rooms');

  const placeholderMeta = plurals.rooms.quantities.one.placeholders.find(
    entry => entry.name === 'count'
  );
   assert(placeholderMeta?.isPluralVariable);
});

test('reverseParseValue converts android placeholders back to i18next', () => {
  assert.strictEqual(reverseParseValue('Hello %1$s', 'android', false), 'Hello {{val0}}');
  assert.strictEqual(reverseParseValue('%1$d items', 'android', true), '{{count}} items');
  assert.strictEqual(reverseParseValue('%1$d items', 'android', false), '{{val0}} items');
  assert.strictEqual(reverseParseValue('Price: %1$.2f', 'android', false), 'Price: {{val0, number(minimumFractionDigits: 2)}}');
});

test('reverseParseValue converts ios placeholders back to i18next', () => {
  assert.strictEqual(reverseParseValue('Hello %1$@', 'ios', false), 'Hello {{val0}}');
  assert.strictEqual(reverseParseValue('%#@count@ items', 'ios', true), '{{count}} items');
  assert.strictEqual(reverseParseValue('%1$ld items', 'ios', true), '{{count}} items');
  assert.strictEqual(reverseParseValue('%1$ld items', 'ios', false), '{{val0}} items');
});
