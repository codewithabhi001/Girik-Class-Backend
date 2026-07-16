const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to a local folder
  // This bypasses any corrupted global cache on the CI/CD server
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
