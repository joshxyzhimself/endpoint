
const os = require('os');
const assert = require('assert');
const querystring = require('querystring');
const got = require('got');
const config = require('../config');
const units = require('../units');
const environment_types = require('../environment_types');

assert(typeof config.namespace === 'string');
assert(typeof config.environment === 'string');
assert(typeof config.clickhouse_host === 'string');
assert(typeof config.clickhouse_port === 'number');

assert(environment_types.has(config.environment) === true);

const namespace = config.namespace;
const environment = config.environment;
const database = `${namespace}-db-${environment}`;

const clickhouse_settings = querystring.stringify({
  date_time_input_format: 'best_effort',
  date_time_output_format: 'iso',
  max_threads: os.cpus().length,
  max_query_size: units.one_gigabyte,
  max_block_size: units.one_gigabyte,
  max_insert_block_size: units.one_million,
  min_insert_block_size_rows: units.one_million,
  min_insert_block_size_bytes: units.one_gigabyte,
  mutations_sync: 2,
});

const clickhouse_endpoint = `http://${config.clickhouse_host}:${config.clickhouse_port}/?${clickhouse_settings}`;

/**
 * @param {string} query
 */
const query_text = async (query) => {
  try {
    assert(typeof query === 'string');
    const response = await got.post(clickhouse_endpoint, { body: query }).json();
    assert(typeof response === 'string');
    return response;
  } catch (e) {
    console.error({ query: query.substring(0, 200) });
    if (e.response instanceof Object && typeof e.response.body === 'string') {
      throw new Error(e.response.body);
    }
    throw e;
  }
};

/**
 * @param {string} query
 */
const query_json = async (query) => {
  try {
    assert(typeof query === 'string');
    const response = await got.post(clickhouse_endpoint, { body: query }).json();
    assert(response instanceof Object);
    assert(response.meta instanceof Array);
    assert(response.data instanceof Array);
    return { columns: response.meta, rows: response.data };
  } catch (e) {
    console.error({ query: query.substring(0, 200) });
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
        return `[${value.map((array_value) => encode(array_value))}]`;
      }
      break;
    }
    default: {
      break;
    }
  }
  throw new Error('encode(value), unexpected primitive type.');
};

const show_databases = async () => {
  const response = await query_json(`
    SHOW DATABASES
    FORMAT JSON;
  `);
  return response;
};
const show_tables = async () => {
  const response = await query_json(`
    SHOW TABLES IN "${database}"
    FORMAT JSON;
  `);
  return response;
};
const create_database = async () => {
  await query_text(`
    CREATE DATABASE IF NOT EXISTS "${database}";
  `);
};
const drop_database = async () => {
  await query_text(`
    DROP DATABASE IF EXISTS "${database}";
  `);
};

/**
 * @param {string} table
 */
const drop_table = async (table) => {
  assert(typeof table === 'string');
  await query_text(`
    DROP TABLE IF EXISTS "${database}"."${table}";
  `);
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
  await query_text(`
    INSERT INTO "${database}"."${table}"
    VALUES ${row_values_concatenated}
  `);
};

/**
 * @param {string} table
 */
const count_table_rows = async (table) => {
  assert(typeof table === 'string');
  const response = await query_json(`
    SELECT COUNT(*)
    FROM "${database}"."${table}"
    FORMAT JSON;
  `);
  return response;
};

/**
 * @param {string} table
 */
function bulk_operation (table) {
  assert(typeof table === 'string');

  const documents = [];

  /**
   * @param {object} document
   */
  this.create = (document) => {
    assert(document instanceof Object);
    documents.push(document);
  };

  this.commit = async () => {
    console.log(`clickhouse: commit "${database}" "${table}" ${documents.length} items, START`);
    if (documents.length > 0) {
      const table_description = await query_json(`
        DESCRIBE "${database}"."${table}" FORMAT JSON;
      `);
      assert(table_description instanceof Object);
      assert(table_description.rows instanceof Array);
      const columns = table_description.rows;
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
      await query_text(`
        INSERT INTO "${database}"."${table}" ${column_names_concatenated}
        VALUES ${rows_concatenated};
      `);
    }
    console.log(`clickhouse: commit "${database}" "${table}" ${documents.length} items, OK`);
  };
}

module.exports = {
  namespace,
  environment,
  database,
  query_text,
  query_json,
  encode,
  show_databases,
  show_tables,
  create_database,
  drop_database,
  drop_table,
  insert_table_rows,
  count_table_rows,

  bulk_operation,
};