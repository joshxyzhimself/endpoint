
// @ts-check


const fs = require('fs');
const path = require('path');
const assert = require('../core/assert');


/**
 * @param {string} file_path
 */
const read = (file_path) => {
  assert(typeof file_path === 'string');
  assert(path.isAbsolute(file_path) === true);
  return JSON.parse(fs.readFileSync(file_path, { encoding: 'utf-8' }));
};


/**
 * @param {string} file_path
 * @param {unknown} file_data
 */
const write = (file_path, file_data) => {
  assert(typeof file_path === 'string');
  assert(path.isAbsolute(file_path) === true);
  assert(file_data instanceof Object);
  fs.writeFileSync(file_path, JSON.stringify(file_data));
};



const json = { read, write };


module.exports = json;