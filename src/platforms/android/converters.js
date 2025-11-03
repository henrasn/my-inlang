const QUANTITY_ORDER = ['zero', 'one', 'two', 'few', 'many', 'other'];
const { reverseParseValue } = require('./parsers');

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

function fromAndroidXml(xml) {
  const json = {};

  // Parse strings
  const stringRegex = /<string name="([^"]+)">(.*?)<\/string>/gs;
  let match;
  while ((match = stringRegex.exec(xml)) !== null) {
    const key = match[1];
    let value = match[2];
    value = value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    json[key] = reverseParseValue(value, 'android', false);
  }

  // Parse plurals
  const pluralRegex = /<plurals name="([^"]+)">(.*?)<\/plurals>/gs;
  while ((match = pluralRegex.exec(xml)) !== null) {
    const base = match[1];
    const items = match[2];
    const itemRegex = /<item quantity="([^"]+)">(.*?)<\/item>/gs;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(items)) !== null) {
      const quantity = itemMatch[1];
      let value = itemMatch[2];
      value = value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      json[`${base}_${quantity}`] = reverseParseValue(value, 'android', true);
    }
  }

  return json;
}

function escapeAndroidValue(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { toAndroidXml, fromAndroidXml };