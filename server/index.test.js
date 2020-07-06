
const test = require('ava');

const fs = require('fs');
const got = require('got');
const FormData = require('form-data');

const EndpointServer = require('./index');

const endpoint = new EndpointServer();

endpoint.http(8080, () => {});

test.serial('test 1 : get', async (t) => {
  endpoint.get('/', (request, response) => {
    return response;
  });
  const response = await got.get('http://localhost:8080/').json();
  t.deepEqual(response, {});
});

test.serial('test 2 : get with body', async (t) => {
  endpoint.get('/test2', (request, response) => {
    response.body = { yolo: 'swag' };
    return response;
  });
  const response = await got.get('http://localhost:8080/test2').json();
  t.deepEqual(response, { yolo: 'swag' });
});

test.serial('test 3 : post with application/json body', async (t) => {
  endpoint.post('/test3', (request, response) => {
    response.body = { ...request.body };
    return response;
  });
  const response = await got.post('http://localhost:8080/test3', {
    json: { foo: 'bar' },
  }).json();
  t.deepEqual(response, { foo: 'bar' });
});


test.serial('test 4 : post with multipart/form-data body', async (t) => {
  endpoint.post('/test4', (request, response) => {
    response.body = {
      body: request.body,
      files: {
        length: request.files.length,
      },
      file: {
        fileName: request.files[0].fileName,
        fileSize: request.files[0].file.byteLength,
        mimeType: request.files[0].mimeType,
      }
    };
    return response;
  });
  const form = new FormData();
  form.append('files', fs.createReadStream('./server/capoo.jpeg'));
  form.append('body', JSON.stringify({ foo: 'bar' }), 'body.json');
  const response = await got.post('http://localhost:8080/test4', {
    body: form
  }).json();
  t.deepEqual(response, {
    body: { foo: 'bar' },
    files: { length: 1 },
    file: {
      fileName: 'capoo.jpeg',
      fileSize: 4951,
      mimeType: 'image/jpeg',
    },
  });
});


test.serial('test 5 : post with application/x-www-form-urlencoded body', async (t) => {
  endpoint.post('/test5', (request, response) => {
    response.body = { ...request.body };
    return response;
  });
  const response = await got.post('http://localhost:8080/test5', {
    form: { foo: 'bar' }
  }).json();
  t.deepEqual(response, { foo: 'bar' });
});
