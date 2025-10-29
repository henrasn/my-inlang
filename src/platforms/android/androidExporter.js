const fs = require('fs');
const path = require('path');
const { groupPlurals } = require('../../utils/parsers');
const { toAndroidXml } = require('../../utils/converters');
const { getVariablePattern } = require('../../utils/config');

function exportAndroid(settings, androidFiles, outputDir) {
  const languages = settings.languageTags;
  const variablePattern = getVariablePattern(settings);
  const parserOptions = {
    platform: 'android',
    variablePattern,
    numericHints: ['count'],
    pluralVariableCandidates: ['count']
  };

  for (let file of androidFiles) {
    for (let lang of languages) {
      const jsonPath = path.join('messages', lang, `${file}.json`);
      if (fs.existsSync(jsonPath) && fs.statSync(jsonPath).size > 0) {
        const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const { strings, plurals } = groupPlurals(json, parserOptions);
        const xml = toAndroidXml(strings, plurals);
        const langSuffix = lang === settings.sourceLanguageTag ? '' : `-${lang}`;
        const dirPath = path.join(outputDir, 'android', `values${langSuffix}`);
        fs.mkdirSync(dirPath, { recursive: true });
        const outputPath = path.join(dirPath, `${file}.xml`);
        fs.writeFileSync(outputPath, xml, 'utf8');
      }
    }
  }
}

module.exports = { exportAndroid };
