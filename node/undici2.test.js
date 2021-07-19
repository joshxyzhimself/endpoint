
// @ts-check

const fs = require('fs');
const path = require('path');
const process = require('process');
const assert = require('assert');
const undici2 = require('./undici2');
const uwu = require('./uwu');


const image_file_path = path.join(process.cwd(), '/node/undici2.test.jpg');


process.nextTick(async () => {


  const json_get_response = await undici2.request({
    method: 'GET',
    url: 'https://ipinfo.io/json?token=24685cdbd4a1ac',
  });
  console.log(json_get_response);


  const json_post_response = await undici2.request({
    method: 'POST',
    url: 'https://ipinfo.io/batch?token=24685cdbd4a1ac',
    json: ['8.8.8.8/country', '8.8.4.4/country'],
  });
  console.log(json_post_response);


  const form_post_response = await undici2.request({
    method: 'POST',
    url: 'https://api.imgur.com/3/upload',
    headers: {
      authorization: 'Client-ID 09fac1ab310235c',
    },
    multipart: [
      {
        name: 'title',
        value: 'test_title',
      },
      {
        name: 'description',
        value: 'test_description',
      },
      {
        name: 'type',
        value: 'file',
      },
      {
        name: 'name',
        value: 'undici2.test.jpg',
      },
      {
        name: 'image',
        value: fs.readFileSync(image_file_path),
        filename: 'undici2.test.jpg',
      },
    ],
  });
  console.log(form_post_response);


  const port = 8080;
  const origin = `http://localhost:${port}`;
  const app = uwu.uws.App({});
  app.post('/test-json', uwu.serve_handler(async (response, request) => {
    console.log({ request });
    response.json = { foo: 'bar' };
  }));
  app.get('/test-internal-error', uwu.serve_handler(async () => {
    throw new Error('Test error.');
  }));
  const token = await uwu.serve_http(app, uwu.port_access_types.SHARED, port);
  {
    const request_abort_controller = new AbortController();
    const response = await undici2.request({
      method: 'POST',
      url: `${origin}/test-json`,
      json: { foo: 'bar' },
      signal: request_abort_controller.signal,
    });
    assert(response.status === 200);
    assert.deepStrictEqual(response.body.json, { foo: 'bar' });
  }
  {
    const response = await undici2.request({
      method: 'GET',
      url: `${origin}/test-internal-error`,
    });
    assert(response.status === 500);
  }
  uwu.uws.us_listen_socket_close(token);
});