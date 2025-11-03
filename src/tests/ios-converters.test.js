const { test } = require('node:test');
const assert = require('node:assert');
const { toXcstrings, fromXcstrings } = require('../platforms/ios/converters');

test('toXcstrings generates structure with plural variations', () => {
  const allStrings = {
    en: { greeting: { value: 'Hello %1$@' } },
    id: { greeting: { value: 'Halo %1$@' } }
  };

  const pluralPlaceholder = {
    name: 'count',
    rendered: '%#@count@',
    isPluralVariable: true
  };

  const allPlurals = {
    en: {
      rooms: {
        pluralVariable: 'count',
        quantities: {
          one: {
            value: '%#@count@ room',
            placeholders: [pluralPlaceholder]
          },
          other: {
            value: '%#@count@ rooms',
            placeholders: [pluralPlaceholder]
          }
        }
      }
    },
    id: {}
  };

  const languages = ['en', 'id'];
  const xcstring = toXcstrings(allStrings, allPlurals, languages, 'en');

  assert.strictEqual(xcstring.version, '1.0');
  assert.strictEqual(xcstring.strings.greeting.localizations.en.stringUnit.value, 'Hello %1$@');
  assert.strictEqual(xcstring.strings.greeting.localizations.id.stringUnit.value, 'Halo %1$@');

  const pluralLocalization = xcstring.strings.rooms.localizations.en;
  assert(pluralLocalization);
  assert.strictEqual(
    pluralLocalization.variations.plural.one.stringUnit.value,
    '%#@count@ room'
  );
  assert.strictEqual(
    pluralLocalization.variations.plural.other.stringUnit.value,
    '%#@count@ rooms'
  );
   assert.strictEqual(
     pluralLocalization.stringVariations.count.formatSpecifier,
     '%#@count@'
   );
 });

test('fromXcstrings parses XCStrings back to JSON for a language', () => {
  const xcstring = {
    version: '1.0',
    sourceLanguage: 'en',
    strings: {
      greeting: {
        extractionState: 'manual',
        localizations: {
          en: { stringUnit: { state: 'translated', value: 'Hello %1$@' } },
          id: { stringUnit: { state: 'translated', value: 'Halo %1$@' } }
        }
      },
      rooms: {
        extractionState: 'manual',
        localizations: {
          en: {
            variations: {
              plural: {
                one: { stringUnit: { state: 'translated', value: '%#@count@ room' } },
                other: { stringUnit: { state: 'translated', value: '%#@count@ rooms' } }
              }
            }
          }
        }
      }
    }
  };

  const enJson = fromXcstrings(xcstring, 'en');
  assert.strictEqual(enJson.greeting, 'Hello {{val0}}');
  assert.strictEqual(enJson.rooms_one, '{{count}} room');
  assert.strictEqual(enJson.rooms_other, '{{count}} rooms');

  const idJson = fromXcstrings(xcstring, 'id');
  assert.strictEqual(idJson.greeting, 'Halo {{val0}}');
  assert.strictEqual(Object.keys(idJson).length, 1); // only greeting for id
});
