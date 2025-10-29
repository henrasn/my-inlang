const fs = require('fs');

const DEFAULT_VARIABLE_PATTERN = ['{{', '}}'];

function loadSettings() {
  return JSON.parse(fs.readFileSync('project.inlang/settings.json'));
}

function getVariablePattern(settings) {
  return (
    settings?.['plugin.inlang.i18next']?.variableReferencePattern ?? DEFAULT_VARIABLE_PATTERN
  );
}

module.exports = { loadSettings, getVariablePattern };
