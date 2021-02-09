
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const config_filename = path.join(process.cwd(), '.config.json');

assert(fs.existsSync(config_filename) === true);

const raw_config = fs.readFileSync(config_filename);
const parsed_config = JSON.parse(raw_config);

module.exports = parsed_config;