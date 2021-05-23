// @ts-check

const fs = require('fs');
const assert = require('assert');
const got = require('got');

const uwu = require('./uwu');

const port = 8080;
const origin = `http://localhost:${port}`;
const app = uwu.uws.App({});

const test_html = `
<html>
  <body>
    <h4>Hello world!</h4>
  </body>
</html>
`;

const test_file = fs.readFileSync(__filename, { encoding: 'utf-8' });

uwu.serve_static(app, '/test-static/', '/', { file_cache: false, compress: false });
uwu.serve_static(app, '/test-compressed-static/', '/', { file_cache: false, compress: true });
uwu.serve_static(app, '/test-cached-static/', '/', { file_cache: true, compress: false });
uwu.serve_static(app, '/test-compressed-cached-static/', '/', { file_cache: true, compress: true });

app.get('/test-html', uwu.serve_handler(async (response) => {
  response.html = test_html;
}));

app.get('/test-compressed-html', uwu.serve_handler(async (response) => {
  response.html = test_html;
  response.compress = true;
}));
app.get('/test-headers', uwu.serve_handler(async (response, request) => {
  response.json = request;
}));
app.post('/test-json-post', uwu.serve_handler(async (response, request) => {
  response.json = request;
}));

app.listen(port, async () => {
  console.log(`Listening at port "${port}".`);

  const response = await got.get(`${origin}/test-html`);
  assert(response.headers['content-encoding'] === undefined);
  console.log('test 1 OK');

  const response2 = await got.get(`${origin}/test-html`).text();
  assert(response2 === test_html);
  console.log('test 2 OK');

  const response3 = await got.get({ url: `${origin}/test-compressed-html` });
  assert(response3.headers['content-encoding'] === 'br');
  console.log('test 3 OK');

  const response4 = await got.get(`${origin}/test-compressed-html`).text();
  assert(response4 === test_html);
  console.log('test 4 OK');

  const response5 = await got.get(`${origin}/test-static/node/uwu.test.js`);
  assert(response5.headers['content-encoding'] === undefined);
  console.log('test 5 OK');

  const response6 = await got.get(`${origin}/test-static/node/uwu.test.js`).text();
  assert(response6 === test_file);
  console.log('test 6 OK');

  const response7 = await got.get(`${origin}/test-compressed-static/node/uwu.test.js`);
  assert(response7.headers['content-encoding'] === 'br');
  console.log('test 7 OK');

  const response8 = await got.get(`${origin}/test-compressed-static/node/uwu.test.js`).text();
  assert(response8 === test_file);
  console.log('test 8 OK');

  const response9 = await got.get(`${origin}/test-cached-static/node/uwu.test.js`);
  assert(response9.headers['content-encoding'] === undefined);
  console.log('test 9 OK');

  const response10 = await got.get(`${origin}/test-cached-static/node/uwu.test.js`).text();
  assert(response10 === test_file);
  console.log('test 10 OK');

  const response11 = await got.get(`${origin}/test-compressed-cached-static/node/uwu.test.js`);
  assert(response11.headers['content-encoding'] === 'br');
  console.log('test 11 OK');

  const response12 = await got.get(`${origin}/test-compressed-cached-static/node/uwu.test.js`).text();
  assert(response12 === test_file);
  console.log('test 12 OK');

  const response13 = await got.get(`${origin}/test-headers`).json();
  assert(response13 instanceof Object);
  assert(response13.method === 'get');
  assert(response13.headers instanceof Object);
  assert(response13.headers.host === 'localhost:8080');
  console.log('test 13 OK');

  const response14 = await got.post({ url: `${origin}/test-json-post`, json: { foo: 'bar' } }).json();
  assert(response14 instanceof Object);
  assert(response14.method === 'post');
  assert(response14.json instanceof Object);
  assert(response14.json.foo === 'bar');
  console.log('test 14 OK');

  process.exit();
});