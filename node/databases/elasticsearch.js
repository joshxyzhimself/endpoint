const assert = require('assert');
const ElasticSearch = require('@elastic/elasticsearch');
const config = require('../config');
const environment_types = require('../environment_types');

assert(typeof config.namespace === 'string');
assert(typeof config.environment === 'string');
assert(typeof config.elasticsearch_host === 'string');
assert(typeof config.elasticsearch_port === 'number');
assert(typeof config.elasticsearch_username === 'string');
assert(typeof config.elasticsearch_password === 'string');

assert(environment_types.has(config.environment) === true);

const namespace = config.namespace;
const environment = config.environment;

const client = new ElasticSearch.Client({
  node: `http://${config.elasticsearch_host}:${config.elasticsearch_port}`,
  auth: {
    username: config.elasticsearch_username,
    password: config.elasticsearch_password,
  },
  requestTimeout: 90000,
  pingTimeout: 30000,
});

/**
 * @param {string} index
 */
const format_index = (index) => {
  assert(typeof index === 'string');
  const formatted_index = [namespace, environment, index].join('_');
  return formatted_index;
};

const create_index = async (index, body) => {
  assert(typeof index === 'string');
  assert(body === undefined || body instanceof Object);
  await client.indices.create({ index: format_index(index), body });
  console.log(`elastic: create_index ${format_index(index)}, OK`);
};

const delete_index = async (index) => {
  assert(typeof index === 'string');
  try {
    await client.indices.delete({ index: format_index(index) });
  } catch (e) {
    if (e.message !== 'index_not_found_exception') {
      throw new Error(e);
    }
  }
  console.log(`elastic: delete_index ${format_index(index)}, OK`);
};

const refresh_indices = async (...indices) => {
  indices.forEach((index) => {
    assert(typeof index === 'string');
  });
  await client.indices.refresh({
    index: indices.map((index) => format_index(index)).join(','),
    ignore_unavailable: false,
    allow_no_indices: false,
  });
  console.log(`elastic: refresh_indices ${indices.map((index) => format_index(index)).join(',')}, OK`);
};

// create:
// Indexes the specified document if it does not already exist.
// The following line must contain the source data to be indexed.
// https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html


const operation_types = new Set(['create', 'index', 'update']);

function bulk_operation () {
  const operations = [];
  const request_body = [];
  const documents = [];
  const ignored_error_types = new Set();

  /**
   * @param {object} document
   * @param {string} operation
   */
  const create_action = (operation, datasource, document, document_id) => {
    assert(typeof operation === 'string');
    assert(operation_types.has(operation) === true);
    assert(datasource instanceof Object);
    assert(typeof datasource.index === 'string');
    assert(document instanceof Object);

    // optional document_id on INDEX operation
    if (operation === 'index') {
      assert(document_id === undefined || typeof document_id === 'string');
    }

    // require document_id on CREATE and UPDATE operations
    if (operation === 'create' || operation === 'update') {
      assert(typeof document_id === 'string');
    }

    operations.push(operation);
    request_body.push({ [operation]: { _index: format_index(datasource.index), _id: document_id } });
    request_body.push(document);
    documents.push(document);
    return document;
  };

  /**
   * @param {object} document
   * @param {object} datasource
   * @param {string|void} document_id
   */
  this.index = (datasource, document, document_id) => create_action('index', datasource, document, document_id);

  /**
   * @param {object} document
   * @param {object} datasource
   * @param {string|void} document_id
   */
  this.create = (datasource, document, document_id) => create_action('create', datasource, document, document_id);

  /**
   * @param {object} document
   * @param {object} datasource
   * @param {string|void} document_id
   */
  this.update = (datasource, document, document_id) => create_action('update', datasource, document, document_id);

  /**
   * @param  {string[]} error_types
   */
  this.ignore_error_types = (...error_types) => {
    error_types.forEach((error_type) => {
      assert(typeof error_type === 'string');
      ignored_error_types.add(error_type);
    });
  };

  this.commit = async () => {
    console.log('elastic: bulk_operation.commit, START');
    if (documents.length > 0) {
      const bulk_response = await client.bulk({ refresh: false, body: request_body }); // eslint-disable-line no-await-in-loop
      assert(bulk_response.body instanceof Object);
      assert(bulk_response.body.items instanceof Object);
      if (bulk_response.body.errors === true) {
        const errorred_items = [];
        bulk_response.body.items.forEach((item, item_index) => {
          assert(item instanceof Object);
          const item_operation = item[operations[item_index]];
          assert(item_operation instanceof Object);
          if (item_operation.error !== undefined) {
            assert(item_operation.error instanceof Object);
            assert(typeof item_operation.error.type === 'string');
            if (ignored_error_types.has(item_operation.error.type) === false) {
              errorred_items.push(item);
            }
          }
        });
        if (errorred_items.length > 0) {
          console.error(JSON.stringify({ errorred_items }, null, 2));
          throw new Error('elastic: bulk_operation.commit, ERROR');
        }
      }
      bulk_response.body.items.forEach((item, item_index) => {
        assert(item instanceof Object);
        const item_operation = item[operations[item_index]];
        assert(typeof item_operation._id === 'string');
        const document = documents[item_index];
        if (documents[item_index]._id === undefined) {
          document._id = item_operation._id;
        }
      });
    }
    console.log('elastic: bulk_operation.commit, OK');
  };
}

/**
 * @param {object} body
 * @param {number} limit
 * @param {number} offset
 * @param {string[]} indices
 */
const search_by_body = async (body, limit, offset, ...indices) => {
  assert(body instanceof Object);
  assert(typeof offset === 'number');
  assert(typeof limit === 'number');
  const response = await client.search({
    index: indices.map((index) => format_index(index)).join(','),
    size: limit,
    from: offset,
    body: {
      ...body,
      highlight: {
        order: 'score',
        fields: {
          '*': { pre_tags: ['<strong>'], post_tags: ['</strong>'] },
        },
      },
      track_total_hits: true,
    },
  });
  assert(response instanceof Object);
  assert(response.body instanceof Object);
  assert(response.body.hits instanceof Object);
  assert(response.body.hits.hits instanceof Array);
  assert(typeof response.body.took === 'number');

  /**
   * @type {object[]}
   */
  const hits = response.body.hits.hits;

  /**
   * @type {number}
   */
  const count = response.body.hits.total.value;

  /**
   * @type {number}
   */
  const took = response.body.took;

  const results = { hits, count, took };
  return results;
};

/**
 * @param {string} query_string
 * @param {number} limit
 * @param {number} offset
 * @param  {string[]} indices
 */
const search_by_text = async (query_string, limit, offset, ...indices) => {
  assert(typeof query_string === 'string');
  assert(typeof offset === 'number');
  assert(typeof limit === 'number');
  indices.forEach((index) => {
    assert(typeof index === 'string');
  });
  const body = {};
  if (query_string !== '') {
    Object.assign(body, { query: { simple_query_string: { query: query_string } } });
  }
  const results = await search_by_body(body, limit, offset, ...indices);
  return results;
};

const elasticsearch = {
  client,
  format_index,
  create_index,
  delete_index,
  refresh_indices,
  bulk_operation,
  search_by_body,
  search_by_text,
};

module.exports = elasticsearch;