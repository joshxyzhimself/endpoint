
// @ts-check


const os = require('os');
const querystring = require('querystring');
const assert = require('../../core/assert');
const units = require('../../core/units');
const undici2 = require('../undici2');


const create_ch_client = (clickhouse_host, clickhouse_port, clickhouse_database, clickhouse_options) => {
  assert(typeof clickhouse_host === 'string');
  assert(typeof clickhouse_port === 'number');
  assert(typeof clickhouse_database === 'string');
  assert(clickhouse_options === undefined || clickhouse_options instanceof Object);
  const clickhouse_options_stringified = querystring.stringify({
    date_time_input_format: 'best_effort',
    date_time_output_format: 'iso',
    max_threads: os.cpus().length,
    max_query_size: units.one_gigabyte,
    max_block_size: units.one_gigabyte,
    max_insert_block_size: units.one_million,
    min_insert_block_size_rows: units.one_million,
    min_insert_block_size_bytes: units.one_gigabyte,
    mutations_sync: 2,
    ...clickhouse_options,
  });


  const clickhouse_url = `http://${clickhouse_host}:${clickhouse_port}/?${clickhouse_options_stringified}`;


  /**
   * @param {string} query_string
   */
  const query = async (query_string) => {
    try {
      assert(typeof query_string === 'string');
      const response = await undici2.request({
        method: 'POST',
        url: clickhouse_url,
        headers: { 'x-clickhouse-format': 'JSON' },
        buffer: query_string,
      });
      return response;
    } catch (e) {
      console.error({ query: query_string.substring(0, 200) });
      if (e.response instanceof Object && typeof e.response.body === 'string') {
        throw new Error(e.response.body);
      }
      throw e;
    }
  };


  const encode = (value) => {
    switch (typeof value) {
      case 'string': {
        return `'${value.replace(/'/g, '\\\'')}'`;
      }
      case 'number':
      case 'boolean': {
        return String(value);
      }
      case 'object': {
        if (value === null) {
          return 'NULL';
        }
        if (value instanceof Array) {
          return `[${value.map((array_value) => encode(array_value)).join(',')}]`;
        }
        break;
      }
      default: {
        break;
      }
    }
    throw new Error('encode(value), unhandled primitive type.');
  };


  const show_databases = async () => {
    const response = await query(`
      SHOW DATABASES
      FORMAT JSON;
    `);
    return response;
  };


  const show_tables = async () => {
    const response = await query(`
      SHOW TABLES IN "${clickhouse_database}"
      FORMAT JSON;
    `);
    return response;
  };


  const create_database = async () => {
    const response = await query(`
      CREATE DATABASE IF NOT EXISTS "${clickhouse_database}";
    `);
    return response;
  };


  const drop_database = async () => {
    const response = await query(`
      DROP DATABASE IF EXISTS "${clickhouse_database}";
    `);
    return response;
  };


  /**
   * @param {string} table
   */
  const drop_table = async (table) => {
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
  const insert_table_rows = async (table, rows) => {
    assert(typeof table === 'string');
    assert(rows instanceof Array);
    const row_values = [];
    rows.forEach((row) => {
      assert(row instanceof Object);
      assert(typeof row.id === 'string');
      const row_propertry_values = Object.values(row);
      const row_propertry_values_encoded = row_propertry_values.map((value) => encode(value));
      const row_propertry_values_concatenated = `(${row_propertry_values_encoded.join(', ')})`;
      row_values.push(row_propertry_values_concatenated);
    });
    const row_values_concatenated = row_values.join(', ');
    await query(`
      INSERT INTO "${clickhouse_database}"."${table}"
      VALUES ${row_values_concatenated}
    `);
  };


  /**
   * @param {string} table
   */
  const count_table_rows = async (table) => {
    assert(typeof table === 'string');
    const response = await query(`
      SELECT COUNT(*)
      FROM "${clickhouse_database}"."${table}"
      FORMAT JSON;
    `);
    return response;
  };


  /**
   * @param {string} table
   */
  const create_bulk_operation = (table) => {
    assert(typeof table === 'string');
    const documents = [];


    /**
     * @param {object} document
     */
    const create = (document) => {
      assert(document instanceof Object);
      documents.push(document);
    };


    const commit = async () => {
      if (documents.length > 0) {
        const table_description = await query(`
          DESCRIBE "${clickhouse_database}"."${table}" FORMAT JSON;
        `);
        assert(table_description instanceof Object);

        // @ts-ignore
        assert(table_description.body.json.data instanceof Array);

        // @ts-ignore
        const columns = table_description.body.json.data;

        columns.forEach((column) => {
          assert(column instanceof Object);
          assert(typeof column.name === 'string');
        });
        const column_names = columns.map((column) => column.name);
        const column_names_concatenated = `(${column_names.join(', ')})`;
        const rows = [];
        documents.forEach((document) => {
          const document_property_values_encoded = [];
          column_names.forEach((column_name) => {
            const document_property_key = column_name;
            const document_property_value = document[document_property_key];
            assert(document_property_value !== undefined);
            const document_property_value_encoded = encode(document_property_value);
            document_property_values_encoded.push(document_property_value_encoded);
          });
          const document_property_values_encoded_concatenated = `(${document_property_values_encoded.join(', ')})`;
          rows.push(document_property_values_encoded_concatenated);
        });
        const rows_concatenated = rows.join(', ');
        await query(`
          INSERT INTO "${clickhouse_database}"."${table}" ${column_names_concatenated}
          VALUES ${rows_concatenated};
        `);
      }
    };


    const bulk_operation = {
      create,
      commit,
    };


    return bulk_operation;
  };


  const ch_client = {
    clickhouse_host,
    clickhouse_port,
    clickhouse_database,
    clickhouse_options,
    query,
    encode,
    show_databases,
    show_tables,
    create_database,
    drop_database,
    drop_table,
    insert_table_rows,
    count_table_rows,
    create_bulk_operation,
  };


  return ch_client;
};


const clickhouse = { create_ch_client };


module.exports = clickhouse;