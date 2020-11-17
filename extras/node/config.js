/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const process = require('process');

const process_cwd = process.cwd();

const config_path = path.join(process_cwd, '/.config.json');

if (fs.existsSync(config_path) === false) {
  throw new Error('/.config.json not found.');
}

const config = JSON.parse(fs.readFileSync(config_path, 'utf-8'));

console.log('@', new Date().toUTCString());
console.log({ config });

module.exports = config;