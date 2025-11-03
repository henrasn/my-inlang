const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { fromAndroidXml } = require('../platforms/android/converters');
const { fromXcstrings } = require('../platforms/ios/converters');

let configPath = process.env.TARGET_CONFIG;
if (!configPath) {
  configPath = fs.existsSync('../.i18n-config.json') ? '../.i18n-config.json' : './sample/.i18n-config.json';
}
const platform = process.argv[2];

if (!fs.existsSync(configPath)) {
  console.error(`Config file ${configPath} not found`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Get available languages
const langs = fs.readdirSync('messages').filter(dir => {
  return fs.statSync(path.join('messages', dir)).isDirectory();
});

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.toLowerCase() === 'y' || ans.toLowerCase() === 'yes');
  }));
}

async function mergeJson(existing, imported, filePath) {
  const updates = [];
  const conflicts = [];

  for (const [key, value] of Object.entries(imported)) {
    if (!(key in existing)) {
      updates.push({ key, value, type: 'new' });
    } else if (existing[key] !== value) {
      const proceed = await askQuestion(`Key "${key}" differs:\n  Existing: "${existing[key]}"\n  Imported: "${value}"\nOverwrite? (y/n): `);
      if (proceed) {
        updates.push({ key, value, type: 'update' });
      } else {
        console.log(`Skipped updating ${key}`);
      }
    }
  }

  // Apply updates
  for (const update of updates) {
    existing[update.key] = update.value;
    console.log(`${update.type === 'new' ? 'Added' : 'Updated'} ${update.key} in ${filePath}`);
  }

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n');
}

async function importAndroid() {
  if (!config.android) {
    console.log('Android config not found, skipping');
    return;
  }
  const baseDir = config.android;
  const settings = JSON.parse(fs.readFileSync('project.inlang/settings.json'));
  const sourceLang = settings.sourceLanguageTag;
  for (const lang of langs) {
    const langSuffix = lang === sourceLang ? '' : `-${lang}`;
    const valuesDir = path.join(baseDir, `values${langSuffix}`);
    if (!fs.existsSync(valuesDir)) {
      console.log(`Android dir ${valuesDir} not found, skipping ${lang}`);
      continue;
    }
    const files = fs.readdirSync(valuesDir).filter(file => file.endsWith('.xml'));
    for (const file of files) {
      const xmlFile = path.join(valuesDir, file);
      const xml = fs.readFileSync(xmlFile, 'utf8');
      const imported = fromAndroidXml(xml);
      const fileName = path.basename(file, '.xml');
      const jsonFile = `messages/${lang}/${fileName}.json`;
      let existing = {};
      if (fs.existsSync(jsonFile)) {
        const content = fs.readFileSync(jsonFile, 'utf8').trim();
        if (content) {
          existing = JSON.parse(content);
        }
      }
      await mergeJson(existing, imported, jsonFile);
    }
  }
}

async function importIOS() {
  if (!config.ios) {
    console.log('iOS config not found, skipping');
    return;
  }
  const baseDir = config.ios;
  if (!fs.existsSync(baseDir)) {
    console.log(`iOS dir ${baseDir} not found, skipping`);
    return;
  }
  const files = fs.readdirSync(baseDir).filter(file => file.endsWith('.xcstrings'));
  for (const file of files) {
    const xcstringsFile = path.join(baseDir, file);
    const xcstring = JSON.parse(fs.readFileSync(xcstringsFile, 'utf8'));
    for (const lang of langs) {
      const imported = fromXcstrings(xcstring, lang);
      if (Object.keys(imported).length === 0) {
        console.log(`No data for ${lang} in ${xcstringsFile}, skipping`);
        continue;
      }
      const fileName = path.basename(file, '.xcstrings');
      const jsonFile = `messages/${lang}/${fileName}.json`;
      let existing = {};
      if (fs.existsSync(jsonFile)) {
        const content = fs.readFileSync(jsonFile, 'utf8').trim();
        if (content) {
          existing = JSON.parse(content);
        }
      }
      await mergeJson(existing, imported, jsonFile);
    }
  }
}

async function main() {
  if (!platform || platform === 'android') {
    await importAndroid();
  }
  if (!platform || platform === 'ios') {
    await importIOS();
  }
  console.log('Import completed.');
}

main().catch(console.error);