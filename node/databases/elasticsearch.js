
// @ts-check

const ElasticSearch = require('@elastic/elasticsearch');
const assert = require('../../core/assert');


/**
 * @param {string} elasticsearch_host
 * @param {number} elasticsearch_port
 * @param {string} elasticsearch_username
 * @param {string} elasticsearch_password
 */
const create_es_client = (
  elasticsearch_host,
  elasticsearch_port,
  elasticsearch_username,
  elasticsearch_password,
) => {
  assert(typeof elasticsearch_host === 'string');
  assert(typeof elasticsearch_port === 'number');
  assert(typeof elasticsearch_username === 'string');
  assert(typeof elasticsearch_password === 'string');


  const client = new ElasticSearch.Client({
    node: `http://${elasticsearch_host}:${elasticsearch_port}`,
    auth: {
      username: elasticsearch_username,
      password: elasticsearch_password,
    },
    requestTimeout: 90000,
    pingTimeout: 30000,
  });


  /**
   * @type {import('./elasticsearch').create_index}
   */
  const create_index = async (index, body) => {
    assert(typeof index === 'string');
    assert(body === undefined || body instanceof Object);
    await client.indices.create({ index: index, body });
  };


  /**
   * @type {import('./elasticsearch').delete_index}
   */
  const delete_index = async (index) => {
    assert(typeof index === 'string');
    try {
      await client.indices.delete({ index: index });
    } catch (e) {
      if (e.message.includes('index_not_found_exception') === false) {
        throw e;
      }
    }
  };


  /**
   * @type {import('./elasticsearch').refresh_indices}
   */
  const refresh_indices = async (...indices) => {
    indices.forEach((index) => {
      assert(typeof index === 'string');
    });
    await client.indices.refresh({
      index: indices.join(','),
      ignore_unavailable: false,
      allow_no_indices: false,
    });
  };


  /**
   * @type {import('./elasticsearch').search_by_body}
   */
  const search_by_body = async (body, limit, offset, ...indices) => {
    assert(body instanceof Object);
    assert(typeof offset === 'number');
    assert(typeof limit === 'number');
    indices.forEach((index) => {
      assert(typeof index === 'string');
    });
    const response = await client.search({
      index: indices.join(','),
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

    // @ts-ignore
    assert(response.body.hits instanceof Object);

    // @ts-ignore
    assert(response.body.hits.hits instanceof Array);

    // @ts-ignore
    assert(typeof response.body.took === 'number');


    /**
     * @type {object[]}
     */
    // @ts-ignore
    const hits = response.body.hits.hits;


    /**
     * @type {number}
     */
    // @ts-ignore
    const count = response.body.hits.total.value;


    /**
     * @type {number}
     */
    // @ts-ignore
    const took = response.body.took;


    const results = { hits, count, took };
    return results;
  };


  /**
   * @type {import('./elasticsearch').search_by_text}
   */
  const search_by_text = async (query, limit, offset, ...indices) => {
    assert(typeof query === 'string');
    assert(typeof offset === 'number');
    assert(typeof limit === 'number');
    indices.forEach((index) => {
      assert(typeof index === 'string');
    });
    const body = {};
    if (query !== '') {
      Object.assign(body, { query: { simple_query_string: { query } } });
    }
    const results = await search_by_body(body, limit, offset, ...indices);
    return results;
  };


  /**
   * @type {import('./elasticsearch').get_document}
   */
  const get_document = async (index, id) => {
    assert(typeof index === 'string');
    assert(typeof id === 'string');
    const response = await client.get({ index, id });
    assert(response.body instanceof Object);


    /**
     * @type {import('./elasticsearch').document}
     */
    // @ts-ignore
    const document = response.body;


    return document;
  };


  // - "index" adds or replaces a document as necessary.
  // - "create" fails if a document with the same ID already exists in the target,
  // - "update" expects that the partial doc, upsert, and script and its options are specified on the next line.
  // - https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html


  const operation_types = new Set(['create', 'index', 'update']);

  /**
   * @type {import('./elasticsearch').create_bulk_operation}
   */
  const create_bulk_operation = () => {

    const operations = [];

    const request_body = [];

    /**
     * @type {import('./elasticsearch').document[]}
     */
    const documents = [];

    const ignored_error_types = new Set();


    /**
     * @type {import('./elasticsearch').bulk_operation_create_action}
     */
    const create_action = (operation, document) => {
      assert(typeof operation === 'string');
      assert(operation_types.has(operation) === true);
      assert(typeof document._index === 'string');
      assert(document._id === undefined || typeof document._id === 'string');
      assert(document instanceof Object);
      assert(document._source._id === undefined);
      assert(document._source._index === undefined);
      switch (operation) {
        case 'index': {
          assert(document._id === undefined || typeof document._id === 'string');
          break;
        }
        case 'create':
        case 'update': {
          assert(typeof document._id === 'string');
          break;
        }
        default: {
          break;
        }
      }
      operations.push(operation);
      request_body.push({ [operation]: { _index: document._index, _id: document._id } });
      request_body.push(document._source);
      documents.push(document);
      return document;
    };


    /**
     * @type {import('./elasticsearch').bulk_operation_action}
     */
    const index = (document) => create_action('index', document);


    /**
     * @type {import('./elasticsearch').bulk_operation_action}
     */
    const create = (document) => create_action('create', document);


    /**
     * @type {import('./elasticsearch').bulk_operation_action}
     */
    const update = (document) => create_action('update', document);


    /**
     * @param  {string[]} error_types
     */
    const ignore_error_types = (...error_types) => {
      error_types.forEach((error_type) => {
        assert(typeof error_type === 'string');
        ignored_error_types.add(error_type);
      });
    };


    const commit = async () => {
      if (documents.length > 0) {
        const bulk_response = await client.bulk({ refresh: false, body: request_body }); // eslint-disable-line no-await-in-loop
        assert(bulk_response.body instanceof Object);
        // @ts-ignore
        assert(bulk_response.body.items instanceof Object);
        // @ts-ignore
        if (bulk_response.body.errors === true) {
          const errorred_items = [];
          // @ts-ignore
          bulk_response.body.items.forEach((item, item_index) => {
            assert(item instanceof Object);
            const document_operation = item[operations[item_index]];
            assert(document_operation instanceof Object);
            if (document_operation.error instanceof Object) {
              assert(typeof document_operation.error.type === 'string');
              if (ignored_error_types.has(document_operation.error.type) === false) {
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

          /**
           * @type {import('./elasticsearch').document_operation}
           */
          const document_operation = item[operations[item_index]];
          assert(document_operation instanceof Object);
          assert(typeof document_operation._id === 'string');
          assert(typeof document_operation._index === 'string');

          const document = documents[item_index];
          assert(document instanceof Object);
          assert(document._index === document_operation._index);
          assert(document._id === undefined);
          document._id = document_operation._id;

        });
      }
    };


    const bulk_operation = {
      index,
      create,
      update,
      ignore_error_types,
      commit,
    };


    return bulk_operation;
  };


  /**
   * @type {import('./elasticsearch').es_client}
   */
  const es_client = {
    client,
    create_index,
    delete_index,
    refresh_indices,
    search_by_body,
    search_by_text,
    get_document,
    create_bulk_operation,
  };


  return es_client;
};


const elasticsearch = { create_es_client };

module.exports = elasticsearch;