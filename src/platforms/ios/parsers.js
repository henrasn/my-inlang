const DEFAULT_VARIABLE_PATTERN = ['{{', '}}'];
const DEFAULT_NUMERIC_HINTS = ['count'];
const PLURAL_KEY_REGEX = /^(.+)_((zero|one|two|few|many|other))$/;

/**
 * Converts a string literal containing ICU-style placeholders into a token list.
 * @param {string} value
 * @param {[string, string]} variablePattern
 */
function tokenizeMessage(value, variablePattern = DEFAULT_VARIABLE_PATTERN) {
  const [open, close] = variablePattern;
  const openRegex = escapeRegex(open);
  const closeRegex = escapeRegex(close);
  const placeholderRegex = new RegExp(`${openRegex}\\s*([\\s\\S]+?)\\s*${closeRegex}`, 'g');

  const tokens = [];
  let lastIndex = 0;

  value.replace(placeholderRegex, (match, content, offset) => {
    if (offset > lastIndex) {
      tokens.push({ type: 'text', value: value.slice(lastIndex, offset) });
    }
    tokens.push({ type: 'placeholder', ...parsePlaceholderContent(content.trim()) });
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < value.length) {
    tokens.push({ type: 'text', value: value.slice(lastIndex) });
  }

  return tokens;
}

function parsePlaceholderContent(raw) {
  const [namePart, formatterPart] = splitFirstComma(raw);
  const name = namePart.trim();

  let formatter = null;
  let options = {};

  if (formatterPart) {
    const formatterInfo = formatterPart.trim();
    const match = formatterInfo.match(/^([^(]+)(?:\(([\s\S]+)\))?$/);
    if (match) {
      formatter = match[1].trim();
      if (match[2]) {
        options = parseFormatterOptions(match[2]);
      }
    }
  }

  return { name, formatter, options };
}

function splitFirstComma(raw) {
  let depth = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === '(') depth++;
    else if (char === ')') depth = Math.max(depth - 1, 0);
    else if (char === ',' && depth === 0) {
      return [raw.slice(0, i), raw.slice(i + 1)];
    }
  }
  return [raw, null];
}

function parseFormatterOptions(raw) {
  return raw
    .split(',')
    .map(segment => segment.trim())
    .filter(Boolean)
    .reduce((acc, segment) => {
      const [key, value] = segment.split(':').map(part => part.trim());
      if (!key) return acc;
      acc[key] = parseOptionValue(value);
      return acc;
    }, {});
}

function parseOptionValue(value) {
  if (value === undefined) return undefined;
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function assignPlaceholderMeta(tokens, numericHints = DEFAULT_NUMERIC_HINTS) {
  const hints = new Set(numericHints);
  const meta = new Map();
  let index = 1;

  for (const token of tokens) {
    if (token.type !== 'placeholder') continue;
    if (!meta.has(token.name)) {
      const placeholderMeta = inferPlaceholderMeta(token, hints, index);
      meta.set(token.name, placeholderMeta);
      index++;
    }
  }

  return meta;
}

function inferPlaceholderMeta(token, numericHints, index) {
  const { name, formatter, options } = token;
  const meta = {
    name,
    index,
    formatter: formatter || null,
    options,
    type: 'string',
    precision: null,
    rendered: null,
    isPluralVariable: false
  };

  const hintIsNumeric = numericHints.has(name);
  if (formatter === 'number' || hintIsNumeric) {
    const minimumFractionDigits = options?.minimumFractionDigits;
    if (Number.isFinite(minimumFractionDigits) && minimumFractionDigits > 0) {
      meta.type = 'float';
      meta.precision = minimumFractionDigits;
    } else if (formatter === 'number' || hintIsNumeric) {
      meta.type = 'int';
    }
  }

  return meta;
}

function determinePluralVariable(meta, candidates = DEFAULT_NUMERIC_HINTS) {
  for (const candidate of candidates) {
    if (meta.has(candidate)) return candidate;
  }
  for (const placeholder of meta.values()) {
    if (placeholder.type !== 'string') {
      return placeholder.name;
    }
  }
  return null;
}

function renderMessage(tokens, { platform, meta, pluralVariable }) {
  return tokens
    .map(token => {
      if (token.type === 'text') {
        return token.value;
      }
      const placeholder = meta.get(token.name);
      if (!placeholder) {
        return '';
      }

      let rendered;
      if (platform === 'ios') {
        if (pluralVariable && token.name === pluralVariable && placeholder.type !== 'string') {
          rendered = `%#@${placeholder.name}@`;
          placeholder.isPluralVariable = true;
        } else {
          rendered = renderIosPlaceholder(placeholder);
        }
      } else {
        rendered = token.name;
      }

      placeholder.rendered = rendered;
      return rendered;
    })
    .join('');
}

function renderIosPlaceholder(meta) {
  if (meta.type === 'string') {
    return `%${meta.index}$@`;
  }
  if (meta.type === 'int') {
    return `%${meta.index}$ld`;
  }
  if (meta.type === 'float') {
    const precision = Number.isInteger(meta.precision) ? `.${meta.precision}` : '';
    return `%${meta.index}$${precision}f`;
  }
  return `%${meta.index}$@`;
}

function plainMeta(meta) {
  return Array.from(meta.values()).map(entry => ({
    name: entry.name,
    index: entry.index,
    formatter: entry.formatter,
    options: entry.options,
    type: entry.type,
    precision: entry.precision,
    rendered: entry.rendered,
    isPluralVariable: entry.isPluralVariable
  }));
}

function groupPlurals(json, options = {}) {
  const {
    platform = 'ios',
    variablePattern = DEFAULT_VARIABLE_PATTERN,
    numericHints = DEFAULT_NUMERIC_HINTS,
    pluralVariableCandidates = DEFAULT_NUMERIC_HINTS
  } = options;

  const strings = {};
  const plurals = {};

  for (const [key, rawValue] of Object.entries(json)) {
    const value = String(rawValue ?? '');
    const tokens = tokenizeMessage(value, variablePattern);
    const meta = assignPlaceholderMeta(tokens, numericHints);
    const match = key.match(PLURAL_KEY_REGEX);

    if (match) {
      const [, base, quantity] = match;
      if (!plurals[base]) {
        plurals[base] = { quantities: {}, pluralVariable: null };
      }

      const pluralVariable =
        plurals[base].pluralVariable || determinePluralVariable(meta, pluralVariableCandidates);
      plurals[base].pluralVariable = pluralVariable;

      const formattedValue = renderMessage(tokens, { platform, meta, pluralVariable });
      plurals[base].quantities[quantity] = {
        value: formattedValue,
        placeholders: plainMeta(meta)
      };
    } else {
      const formattedValue = renderMessage(tokens, { platform, meta });
      strings[key] = {
        value: formattedValue,
        placeholders: plainMeta(meta)
      };
    }
  }

  return { strings, plurals };
}

function reverseParseValue(value, platform, isPlural = false) {
  let index = 0;
  const stringPlaceholder = /%(\d+)\$@/g;
  const numberPlaceholder = /%(\d+)\$ld/g;
  const floatPlaceholder = /%(\d+)\$(\.\d+)?f/g;

  // Handle floats first (more specific)
  value = value.replace(floatPlaceholder, (match, idx, precision) => {
    const varName = isPlural && idx === '1' ? 'count' : `val${index++}`;
    const digits = precision ? precision.slice(1) : '0';
    return `{{${varName}, number(minimumFractionDigits: ${digits})}}`;
  });

  // Then numbers
  value = value.replace(numberPlaceholder, (match, idx) => {
    const varName = isPlural && idx === '1' ? 'count' : `val${index++}`;
    return `{{${varName}${varName.startsWith('val') ? ', number' : ''}}}`;
  });

  // Then strings
  value = value.replace(stringPlaceholder, () => {
    const varName = `val${index++}`;
    return `{{${varName}}}`;
  });

  // For iOS plurals, %#@var@ -> {{var}}
  value = value.replace(/%#@(\w+)@/g, '{{$1}}');

  return value;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  groupPlurals,
  tokenizeMessage,
  reverseParseValue
};