const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { fromAndroidXml } = require('../platforms/android/converters');
const { fromXcstrings } = require('../platforms/ios/converters');

const configPath = process.env.TARGET_CONFIG || '../.i18n-config.json';
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
    const xmlFile = path.join(baseDir, `values${langSuffix}`, 'main.xml');
    if (!fs.existsSync(xmlFile)) {
      console.log(`Android file ${xmlFile} not found, skipping ${lang}`);
      continue;
    }
    const xml = fs.readFileSync(xmlFile, 'utf8');
    const imported = fromAndroidXml(xml);
    const jsonFile = `messages/${lang}/android.json`;
    let existing = {};
    if (fs.existsSync(jsonFile)) {
      existing = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    }
    await mergeJson(existing, imported, jsonFile);
  }
}

async function importIOS() {
  if (!config.ios) {
    console.log('iOS config not found, skipping');
    return;
  }
  const baseDir = config.ios;
  const xcstringsFile = path.join(baseDir, 'main.xcstrings');
  if (!fs.existsSync(xcstringsFile)) {
    console.log(`iOS file ${xcstringsFile} not found, skipping`);
    return;
  }
  const xcstring = JSON.parse(fs.readFileSync(xcstringsFile, 'utf8'));
  for (const lang of langs) {
    const imported = fromXcstrings(xcstring, lang);
    if (Object.keys(imported).length === 0) {
      console.log(`No data for ${lang} in iOS file, skipping`);
      continue;
    }
    const jsonFile = `messages/${lang}/ios.json`;
    let existing = {};
    if (fs.existsSync(jsonFile)) {
      existing = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    }
    await mergeJson(existing, imported, jsonFile);
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