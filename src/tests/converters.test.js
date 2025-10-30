const { test } = require('node:test');
const assert = require('node:assert');
const { toAndroidXml, toXcstrings, fromAndroidXml, fromXcstrings } = require('../utils/converters');

test('toAndroidXml generates correct XML with escaped content', () => {
  const strings = {
    greeting: { value: 'Hello & %1$s' },
    raw: { value: '1 < 2' }
  };
  const plurals = {
    rooms: {
      pluralVariable: 'count',
      quantities: {
        one: { value: '%1$d room' },
        other: { value: '%1$d rooms' }
      }
    }
  };

  const xml = toAndroidXml(strings, plurals);
  assert(xml.includes('<string name="greeting">Hello &amp; %1$s</string>'));
  assert(xml.includes('<string name="raw">1 &lt; 2</string>'));
  assert(xml.includes('<plurals name="rooms">'));
  assert(xml.includes('<item quantity="one">%1$d room</item>'));
  assert(xml.includes('<item quantity="other">%1$d rooms</item>'));
});

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

test('fromAndroidXml parses XML back to JSON', () => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <string name="greeting">Hello &amp; %1$s</string>
  <string name="raw">1 &lt; 2</string>
  <plurals name="rooms">
    <item quantity="one">%1$d room</item>
    <item quantity="other">%1$d rooms</item>
  </plurals>
</resources>`;

  const json = fromAndroidXml(xml);
  assert.strictEqual(json.greeting, 'Hello & {{val0}}');
  assert.strictEqual(json.raw, '1 < 2');
  assert.strictEqual(json.rooms_one, '{{count}} room');
  assert.strictEqual(json.rooms_other, '{{count}} rooms');
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
