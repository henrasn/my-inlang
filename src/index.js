const { exportMobile } = require('./exporter');

const platform = process.argv[2];
exportMobile(platform);