
// @ts-check

const os = require('os');
const querystring = require('querystring');
const assert = require('../../core/assert');
const undici2 = require('../undici2');


const create_ch_client = (clickhouse_host, clickhouse_port, clickhouse_database, clickhouse_options) => {
  assert(typeof clickhouse_host === 'string');
  assert(typeof clickhouse_port === 'number');
  assert(typeof clickhouse_database === 'string');
  assert(clickhouse_options === undefined || clickhouse_options instanceof Object);
  const clickhouse_options_stringified = querystring.stringify({
    max_threads: os.cpus().length,
    max_insert_threads: os.cpus().length,
    date_time_input_format: 'best_effort',
    date_time_output_format: 'iso',
    mutations_sync: 2,
    max_query_size: 100000000000,
    max_block_size: 100000000000,
    http_max_uri_size: 100000000000,
    max_insert_block_size: 100000000000,
    min_insert_block_size_rows: 100000000000,
    min_insert_block_size_bytes: 100000000000,
    ...clickhouse_options,
  });


  const clickhouse_url = `http://${clickhouse_host}:${clickhouse_port}/?${clickhouse_options_stringified}`;


  /**
   * @param {string|Buffer} request_data
   */
  const query = async (request_data) => {
    assert(typeof request_data === 'string' || request_data instanceof Buffer);
    const request_buffer = typeof request_data === 'string'
      ? Buffer.from(request_data)
      : request_data;
    assert(request_buffer.byteLength <= 30000000, 'ERR_BUFFER_GTE_30MB', 'Buffer GTE 30MB.');
    const response = await undici2.request({
      method: 'POST',
      url: clickhouse_url,
      headers: { 'x-clickhouse-format': 'JSON' },
      buffer: request_buffer,
    });
    return response;
  };


  const databases_show = async () => {
    const response = await query(`
      SHOW DATABASES
      FORMAT JSON;
    `);
    return response;
  };


  const database_create = async () => {
    const response = await query(`
      CREATE DATABASE IF NOT EXISTS "${clickhouse_database}";
    `);
    return response;
  };


  const database_drop = async () => {
    const response = await query(`
      DROP DATABASE IF EXISTS "${clickhouse_database}";
    `);
    return response;
  };


  const tables_show = async () => {
    const response = await query(`
      SHOW TABLES IN "${clickhouse_database}"
      FORMAT JSON;
    `);
    return response;
  };


  /**
   * @param {string} table
   */
  const table_drop = async (table) => {
    assert(typeof table === 'string');
    const response = await query(`
      DROP TABLE IF EXISTS "${clickhouse_database}"."${table}";
    `);
    return response;
  };


  /**
   * @param {string} table
   * @param {object[]} rows
   */
  const table_insert_rows = async (table, rows) => {
    assert(typeof table === 'string');
    assert(rows instanceof Array);
    rows.forEach((row) => {
      assert(row instanceof Object);
    });
    const request_data = Buffer.concat([
      Buffer.from(`INSERT INTO "${clickhouse_database}"."${table}" FORMAT JSONEachRow`),
      Buffer.from(rows.map((row) => JSON.stringify(row)).join('\n')),
    ]);
    const response = await query(request_data);
    return response;
  };


  /**
   * @param {string} table
   */
  const table_count_rows = async (table) => {
    assert(typeof table === 'string');
    const response = await query(`
      SELECT COUNT(*) FROM "${clickhouse_database}"."${table}";
    `);
    return response;
  };


  /**
   * @param {string} table
   */
  const table_describe = async (table) => {
    assert(typeof table === 'string');
    const response = await query(`
      DESCRIBE "${clickhouse_database}"."${table}";
    `);
    return response;
  };


  const ch_client = {
    clickhouse_host,
    clickhouse_port,
    clickhouse_database,
    clickhouse_options,

    query,

    databases_show,
    database_create,
    database_drop,

    tables_show,
    table_drop,
    table_count_rows,
    table_describe,
    table_insert_rows,
  };


  return ch_client;
};


const clickhouse = { create_ch_client };


module.exports = clickhouse;