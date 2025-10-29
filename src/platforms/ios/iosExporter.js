const fs = require('fs');
const path = require('path');
const { groupPlurals } = require('../../utils/parsers');
const { toXcstrings } = require('../../utils/converters');
const { getVariablePattern } = require('../../utils/config');

function exportIOS(settings, iosFiles, outputDir) {
  const languages = settings.languageTags;
  const sourceLang = settings.sourceLanguageTag;
  const variablePattern = getVariablePattern(settings);
  const parserOptions = {
    platform: 'ios',
    variablePattern,
    numericHints: ['count'],
    pluralVariableCandidates: ['count']
  };

  for (let file of iosFiles) {
    const allStrings = {};
    const allPlurals = {};
    for (let lang of languages) {
      const jsonPath = path.join('messages', lang, `${file}.json`);
      if (fs.existsSync(jsonPath) && fs.statSync(jsonPath).size > 0) {
        const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const { strings, plurals } = groupPlurals(json, parserOptions);
        allStrings[lang] = strings;
        allPlurals[lang] = plurals;
      } else {
        allStrings[lang] = {};
        allPlurals[lang] = {};
      }
    }
    const xcstring = toXcstrings(allStrings, allPlurals, languages, sourceLang);
    const outputPath = path.join(outputDir, 'ios', `${file}.xcstrings`);
    fs.writeFileSync(outputPath, JSON.stringify(xcstring, null, 2), 'utf8');
  }
}

module.exports = { exportIOS };
