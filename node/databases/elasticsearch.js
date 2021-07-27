
// @ts-check

const ElasticSearch = require('@elastic/elasticsearch');
const assert = require('../../core/assert');


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
   * @param {string} index
   * @param {object} body
   */
  const create_index = async (index, body) => {
    assert(typeof index === 'string');
    assert(body === undefined || body instanceof Object);
    await client.indices.create({ index: index, body });
  };


  /**
   * @param {string} index
   */
  const delete_index = async (index) => {
    assert(typeof index === 'string');
    try {
      await client.indices.delete({ index: index });
    } catch (e) {
      assert(e.message === 'index_not_found_exception');
    }
  };


  /**
   * @param  {string[]} indices
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
   * @param {object} body
   * @param {number} limit
   * @param {number} offset
   * @param {string[]} indices
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


  /**
   * @param {string} index
   * @param {string} id
   */
  const get_document = async (index, id) => {
    assert(typeof index === 'string');
    assert(typeof id === 'string');
    const response = await client.get({ index, id });
    assert(response.body instanceof Object);
    return response.body;
  };


  // - "create" fails if a document with the same ID already exists in the target,
  // - "index" adds or replaces a document as necessary.
  // - "update" expects that the partial doc, upsert, and script and its options are specified on the next line.
  // - https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html


  const operation_types = new Set(['create', 'index', 'update']);

  const create_bulk_operation = () => {
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
      assert(document._id === undefined);
      assert(document._index === undefined);

      // optional document_id on INDEX operation
      if (operation === 'index') {
        assert(document_id === undefined || typeof document_id === 'string');
      }

      // require document_id on CREATE and UPDATE operations
      if (operation === 'create' || operation === 'update') {
        assert(typeof document_id === 'string');
      }

      operations.push(operation);
      request_body.push({ [operation]: { _index: datasource.index, _id: document_id } });
      request_body.push(document);
      documents.push(document);
      return document;
    };


    /**
     * @param {object} document
     * @param {object} datasource
     * @param {string|void} document_id
     */
    const index = (datasource, document, document_id) => create_action('index', datasource, document, document_id);


    /**
     * @param {object} document
     * @param {object} datasource
     * @param {string|void} document_id
     */
    const create = (datasource, document, document_id) => create_action('create', datasource, document, document_id);


    /**
     * @param {object} document
     * @param {object} datasource
     * @param {string|void} document_id
     */
    const update = (datasource, document, document_id) => create_action('update', datasource, document, document_id);


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
        // @ts-ignore
        bulk_response.body.items.forEach((item, item_index) => {
          assert(item instanceof Object);
          const item_operation = item[operations[item_index]];
          assert(typeof item_operation._id === 'string');
          assert(typeof item_operation._index === 'string');
          const document = documents[item_index];
          if (documents[item_index]._id === undefined) {
            document._id = item_operation._id;
            document._index = item_operation._index;
          }
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