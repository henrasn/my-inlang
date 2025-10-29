const fs = require('fs');
const path = require('path');

const configPath = process.env.TARGET_CONFIG || '../.i18n-config.json';
const platform = process.argv[2];

if (!fs.existsSync(configPath)) {
  console.error(`Config file ${configPath} not found`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} to ${dest}`);
}

if (!platform || platform === 'fe') {
  if (config.fe) {
    for (const lang in config.fe) {
      const src = `messages/${lang}/common.json`;
      const dest = config.fe[lang];
      if (fs.existsSync(src)) {
        copyFile(src, dest);
      } else {
        console.warn(`Source file ${src} not found`);
      }
    }
  }
}

if (!platform || platform === 'android') {
  if (config.android) {
    const destDir = config.android;
    if (fs.existsSync('output/android')) {
      fs.readdirSync('output/android').forEach(file => {
        const src = `output/android/${file}`;
        const dest = path.join(destDir, file);
        copyFile(src, dest);
      });
    } else {
      console.warn('output/android directory not found');
    }
  }
}

if (!platform || platform === 'ios') {
  if (config.ios) {
    const destDir = config.ios;
    if (fs.existsSync('output/ios')) {
      fs.readdirSync('output/ios').forEach(file => {
        const src = `output/ios/${file}`;
        const dest = path.join(destDir, file);
        copyFile(src, dest);
      });
    } else {
      console.warn('output/ios directory not found');
    }
  }
}

console.log('Sync completed.');