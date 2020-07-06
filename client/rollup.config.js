
const resolve = require('@rollup/plugin-node-resolve').default;
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('rollup-plugin-terser').terser;

module.exports = {
  input: './client/index.js',
  output: {
    name: 'EndpointClient',
    file: './client/index.iife.js',
    format: 'iife'
  },
  plugins: [resolve(), commonjs(), terser()]
};
