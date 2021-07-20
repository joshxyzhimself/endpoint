
// @ts-check

const fs = require('fs');
const path = require('path');
const assert = require('../core/assert');

/**
 * @typedef {object} json_file
 * @property {object} data
 * @property {Function} save
 * @property {Function} load
 */

/**
 * @type {Map<string, json_file>}
 */
const json_files = new Map();

/**
 * @param {string} file_path
 * @returns {json_file}
 */
const create_json_file = (file_path) => {
  assert(typeof file_path === 'string');
  assert(path.isAbsolute(file_path) === true);

  if (json_files.has(file_path) === true) {
    const json_file = json_files.get(file_path);
    return json_file;
  }

  /**
   * @type {json_file}
   */
  const json_file = {
    data: {},
    save: () => {
      fs.writeFileSync(file_path, JSON.stringify(json_file.data, null, 2));
    },
    load: () => {
      if (fs.existsSync(file_path) === true) {
        json_file.data = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
      } else {
        json_file.save();
      }
    },
  };

  json_file.load();

  json_files.set(file_path, json_file);

  return json_file;
};

module.exports = create_json_file;