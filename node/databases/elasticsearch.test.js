
// @ts-check

const path = require('path');
const process = require('process');
const assert = require('../../core/assert');
const json = require('../json');
const elasticsearch = require('./elasticsearch');

const config_path = path.join(process.cwd(), 'test.config.json');
const config = json.read(config_path);

assert(typeof config.elasticsearch_host === 'string');
assert(typeof config.elasticsearch_port === 'number');
assert(typeof config.elasticsearch_username === 'string');
assert(typeof config.elasticsearch_password === 'string');

const es_client = elasticsearch.create_es_client(
  config.elasticsearch_host,
  config.elasticsearch_port,
  config.elasticsearch_username,
  config.elasticsearch_password,
);

process.nextTick(async () => {


  const es_bulk_operation = es_client.create_bulk_operation();

  /**
   * @type {import('./elasticsearch').document}
   */
  const document = {
    _index: 'test_index',
    _source: {
      unstructured: 'foo bar',
      structured: JSON.stringify({ foo: 'bar' }),
    },
  };

  assert(typeof document._source.unstructured === 'string');
  assert(typeof document._source.structured === 'string');

  es_bulk_operation.index(document);

  await es_bulk_operation.commit();
});