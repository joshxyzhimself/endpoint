```js

uwu.serve_static(app, '/', '/server/static/');
app.get('/*', uwu.serve_handler(async (response) => {
  response.html = render_html();
}));

uwu.serve_static(app, '/charting_library/', '/node_modules/charting_library/');

app.get('/test', uwu.serve_handler(async (response, request) => {
  console.log({ request });
  response.headers['Cache-Control'] = uwu.cache_control_types.no_store;
  response.json = { foo: 'bar', random: Math.random() };
  response.compress = true;
}));

app.get('/test2', uwu.serve_handler(async (response, request) => {
  console.log({ request });
  response.headers['Cache-Control'] = uwu.cache_control_types.no_store;
  response.json = { foo: 'bar', random: Math.random() };
  response.compress = false;
}));

app.post('/test2', uwu.serve_handler(async (response, request) => {
  console.log({ request });
  response.headers['Cache-Control'] = uwu.cache_control_types.no_store;
  response.json = { foo: 'bar', random: Math.random() };
  response.compress = false;
}));

app.get('/test3', uwu.serve_handler(async (response, request) => {
  console.log({ request });
  response.headers['Cache-Control'] = uwu.cache_control_types.no_cache;
  response.file_path = __filename;
  response.cache_files = true;
  response.compress = true;
  response.dispose = false;
  setTimeout(() => console.log({ response }), 1000);
}));

app.get('/test4', uwu.serve_handler(async (response, request) => {
  console.log({ request });
  response.headers['Cache-Control'] = uwu.cache_control_types.no_cache;
  response.file_path = __filename;
  response.cache_files = false;
  response.compress = true;
  response.dispose = false;
  setTimeout(() => console.log({ response }), 1000);
}));

app.get('/test5', uwu.serve_handler(async (response, request) => {
  console.log({ request });
  response.headers['Cache-Control'] = uwu.cache_control_types.no_cache;
  response.text = 'test text';
  response.compress = true;
  setTimeout(() => console.log({ response }), 1000);
}));
```