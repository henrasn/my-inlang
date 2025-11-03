const { test } = require('node:test');
const assert = require('node:assert');
const { groupPlurals, reverseParseValue } = require('../platforms/ios/parsers');

const iosOptions = {
  platform: 'ios',
  variablePattern: ['{{', '}}'],
  numericHints: ['count'],
  pluralVariableCandidates: ['count']
};

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

test('reverseParseValue converts ios placeholders back to i18next', () => {
  assert.strictEqual(reverseParseValue('Hello %1$@', 'ios', false), 'Hello {{val0}}');
  assert.strictEqual(reverseParseValue('%#@count@ items', 'ios', true), '{{count}} items');
  assert.strictEqual(reverseParseValue('%1$ld items', 'ios', true), '{{count}} items');
  assert.strictEqual(reverseParseValue('%1$ld items', 'ios', false), '{{val0, number}} items');
});