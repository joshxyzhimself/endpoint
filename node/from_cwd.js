
// @ts-check


const path = require('path');
const process = require('process');


/**
 * @param {string[]} paths
 */
const from_cwd = (...paths) => path.join(process.cwd(), ...paths);


module.exports = from_cwd;