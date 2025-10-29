const fs = require('fs');
const path = require('path');
const { loadSettings } = require('./utils/config');
const { androidFiles, iosFiles } = require('./utils/filesConfig');
const { exportAndroid } = require('./platforms/android/androidExporter');
const { exportIOS } = require('./platforms/ios/iosExporter');

function exportMobile(platform) {
  const settings = loadSettings();

  const outputDir = 'output';
  if (!platform || platform === 'android') {
    fs.mkdirSync(path.join(outputDir, 'android'), { recursive: true });
    exportAndroid(settings, androidFiles, outputDir);
  }
  if (!platform || platform === 'ios') {
    fs.mkdirSync(path.join(outputDir, 'ios'), { recursive: true });
    exportIOS(settings, iosFiles, outputDir);
  }

  console.log('Export completed.');
}

module.exports = { exportMobile };