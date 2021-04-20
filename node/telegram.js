// 01-23-2021

const assert = require('assert');
const got = require('got');
const multipart = require('multi-part');

const post_form = async (url, body) => {
  assert(typeof url === 'string');
  assert(body instanceof Object);
  const form = new multipart();
  Object.entries(body).forEach((entry) => {
    const [field, value] = entry;
    assert(typeof field === 'string');
    assert(value !== undefined);
    form.append(field, value);
  });
  const form_buffer = await form.buffer();
  const form_headers = form.getHeaders(false);
  const response = await got.post(url, { headers: form_headers, body: form_buffer }).json();
  return response;
};

const post_json = async (url, body) => {
  assert(typeof url === 'string');
  assert(body instanceof Object);
  const response = await got.post(url, { json: body }).json();
  return response;
};

const get_json = async (url, body) => {
  assert(typeof url === 'string');
  assert(body instanceof Object);
  const response = await got.get(url, { searchParams: body }).json();
  return response;
};

const get_buffer = async (url) => {
  assert(typeof url === 'string');
  const response = await got.get(url).buffer();
  return response;
};

const get_text = async (url) => {
  assert(typeof url === 'string');
  const response = await got.get(url).text();
  return response;
};

const create_endpoint = (token, method) => {
  assert(typeof token === 'string');
  assert(typeof method === 'string');
  return `https://api.telegram.org/bot${token}/${method}`;
};

const send_message = async (token, body) => {
  assert(typeof token === 'string');
  assert(body instanceof Object);
  assert(typeof body.chat_id === 'string' || typeof body.chat_id === 'number');
  assert(typeof body.text === 'string');
  const response = await post_json(create_endpoint(token, 'sendMessage'), body);
  return response;
};

const delete_message = async (token, body) => {
  assert(typeof token === 'string');
  assert(body instanceof Object);
  assert(typeof body.chat_id === 'string' || typeof body.chat_id === 'number');
  assert(typeof body.message_id === 'number');
  const response = await post_json(create_endpoint(token, 'deleteMessage'), body);
  return response;
};

const send_photo = async (token, body) => {
  assert(typeof token === 'string');
  assert(body instanceof Object);
  assert(typeof body.chat_id === 'string' || typeof body.chat_id === 'number');
  assert(body.caption === undefined || typeof body.caption === 'string');
  assert(body.photo instanceof Buffer);
  const response = await post_form(create_endpoint(token, 'sendPhoto'), body);
  return response;
};

const delete_webhook = async (token) => {
  assert(typeof token === 'string');
  const response = await post_json(create_endpoint(token, 'deleteWebhook'), {});
  return response;
};

const set_webhook = async (token, body) => {
  assert(typeof token === 'string');
  assert(body instanceof Object);
  assert(typeof body.url === 'string');
  assert(typeof body.max_connections === 'number');
  assert(body.allowed_updates instanceof Array);
  const response = await post_json(create_endpoint(token, 'setWebhook'), body);
  return response;
};

const get_updates = async (token, body) => {
  assert(typeof token === 'string');
  assert(body instanceof Object);
  assert(body.offset === undefined || typeof body.offset === 'number');
  assert(body.allowed_updates instanceof Array);
  const response = await post_json(create_endpoint(token, 'getUpdates'), body);
  assert(response instanceof Object);
  assert(response.result instanceof Array);
  const updates = response.result;
  return updates;
};

const get_me = async (token) => {
  assert(typeof token === 'string');
  const response = await post_json(create_endpoint(token, 'getMe'), {});
  assert(response instanceof Object);
  assert(response.result instanceof Object);
  const me = response.result;
  return me;
};

module.exports = {
  post_form,
  post_json,
  get_json,
  get_buffer,
  get_text,
  create_endpoint,
  send_message,
  delete_message,
  send_photo,
  delete_webhook,
  set_webhook,
  get_updates,
  get_me,
};