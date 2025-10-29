const QUANTITY_ORDER = ['zero', 'one', 'two', 'few', 'many', 'other'];

function toAndroidXml(strings, plurals) {
  const sortedStringKeys = Object.keys(strings || {}).sort();
  const sortedPluralKeys = Object.keys(plurals || {}).sort();
  let xml = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n';

  for (const key of sortedStringKeys) {
    const value = strings[key]?.value ?? '';
    xml += `  <string name="${key}">${escapeAndroidValue(value)}</string>\n`;
  }

  for (const key of sortedPluralKeys) {
    const quantities = plurals[key]?.quantities ?? {};
    xml += `  <plurals name="${key}">\n`;
    for (const quantity of QUANTITY_ORDER) {
      if (!quantities[quantity]) continue;
      const value = quantities[quantity].value ?? '';
      xml += `    <item quantity="${quantity}">${escapeAndroidValue(value)}</item>\n`;
    }
    xml += '  </plurals>\n';
  }

  xml += '</resources>\n';
  return xml;
}

function toXcstrings(allStrings, allPlurals, languages, sourceLang) {
  const keys = new Set();
  for (const lang of languages) {
    const stringEntries = allStrings[lang] || {};
    const pluralEntries = allPlurals[lang] || {};
    Object.keys(stringEntries).forEach(key => keys.add(key));
    Object.keys(pluralEntries).forEach(key => keys.add(key));
  }

  const orderedKeys = Array.from(keys).sort();
  const xcstring = {
    version: '1.0',
    sourceLanguage: sourceLang,
    strings: {}
  };

  for (const key of orderedKeys) {
    const entry = {
      extractionState: 'manual',
      localizations: {}
    };

    for (const lang of languages) {
      const stringEntry = allStrings[lang]?.[key];
      const pluralEntry = allPlurals[lang]?.[key];

      if (stringEntry) {
        entry.localizations[lang] = {
          stringUnit: {
            state: 'translated',
            value: stringEntry.value
          }
        };
      } else if (pluralEntry) {
        const localization = {
          variations: {
            plural: {}
          }
        };

        const quantities = pluralEntry.quantities || {};
        for (const quantity of QUANTITY_ORDER) {
          const variant = quantities[quantity];
          if (!variant) continue;
          localization.variations.plural[quantity] = {
            stringUnit: {
              state: 'translated',
              value: variant.value
            }
          };
        }

        if (pluralEntry.pluralVariable) {
          const pluralPlaceholder = findPluralPlaceholder(quantities, pluralEntry.pluralVariable);
          if (pluralPlaceholder) {
            localization.stringVariations = {
              [pluralEntry.pluralVariable]: {
                ruleType: 'plural',
                formatSpecifier:
                  pluralPlaceholder.rendered || `%#@${pluralEntry.pluralVariable}@`
              }
            };
          }
        }

        entry.localizations[lang] = localization;
      }
    }

    xcstring.strings[key] = entry;
  }

  return xcstring;
}

function findPluralPlaceholder(quantities, pluralVariable) {
  for (const quantity of QUANTITY_ORDER) {
    const variant = quantities[quantity];
    if (!variant?.placeholders) continue;
    const placeholder =
      variant.placeholders.find(ph => ph.isPluralVariable) ||
      variant.placeholders.find(ph => ph.name === pluralVariable);
    if (placeholder) return placeholder;
  }
  const anyVariant = Object.values(quantities || {})[0];
  return anyVariant?.placeholders?.find(ph => ph.name === pluralVariable) ?? null;
}

function escapeAndroidValue(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { toAndroidXml, toXcstrings };
