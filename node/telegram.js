
// @ts-check


const assert = require('../core/assert');
const undici2 = require('./undici2');


/**
 * @param {string} url
 * @param {object} body
 */
const post_form = async (url, body) => {
  assert(typeof url === 'string');
  assert(body instanceof Object);
  const response = await undici2.request({
    url,
    method: 'POST',
    multipart: body,
  });
  assert(response.status === 200);
  assert(response.body.json instanceof Object);
  return response.body.json;
};


/**
 * @param {string} url
 * @param {object} body
 */
const post_json = async (url, body) => {
  assert(typeof url === 'string');
  assert(body instanceof Object);
  const response = await undici2.request({
    url,
    method: 'POST',
    json: body,
  });
  assert(response.status === 200);
  assert(response.body.json instanceof Object);
  return response.body.json;
};


/**
 * @param {string} url
 */
const get_json = async (url) => {
  assert(typeof url === 'string');
  const response = await undici2.request({
    url,
    method: 'GET',
  });
  assert(response.status === 200);
  assert(response.body.json instanceof Object);
  return response.body.json;
};

/**
 * @param {string} url
 */
const get_buffer = async (url) => {
  assert(typeof url === 'string');
  const response = await undici2.request({
    url,
    method: 'GET',
  });
  assert(response.status === 200);
  assert(response.body.buffer instanceof Buffer);
  return response.body.buffer;
};


/**
 * @param {string} url
 */
const get_text = async (url) => {
  assert(typeof url === 'string');
  const response = await undici2.request({
    url,
    method: 'GET',
  });
  assert(response.status === 200);
  assert(typeof response.body.string === 'string');
  return response.body.string;
};


/**
 * @param {string} token
 * @param {string} method
 */
const create_endpoint = (token, method) => {
  assert(typeof token === 'string');
  assert(typeof method === 'string');
  return `https://api.telegram.org/bot${token}/${method}`;
};


/**
 * @param {string} token
 * @param {object} body
 */
const send_message = async (token, body) => {
  assert(typeof token === 'string');
  assert(body instanceof Object);
  assert(typeof body.chat_id === 'number');
  assert(typeof body.text === 'string');
  const response = await post_json(create_endpoint(token, 'sendMessage'), body);
  return response;
};


/**
 * @param {string} token
 * @param {object} body
 */
const delete_message = async (token, body) => {
  assert(typeof token === 'string');
  assert(body instanceof Object);
  assert(typeof body.chat_id === 'number');
  assert(typeof body.message_id === 'number');
  const response = await post_json(create_endpoint(token, 'deleteMessage'), body);
  return response;
};


/**
 * @param {string} token
 * @param {object} body
 */
const send_photo = async (token, body) => {
  assert(typeof token === 'string');
  assert(body instanceof Object);
  assert(typeof body.chat_id === 'number');
  assert(body.caption === undefined || typeof body.caption === 'string');
  assert(body.photo instanceof Buffer);
  const response = await post_form(create_endpoint(token, 'sendPhoto'), body);
  return response;
};


/**
 * @param {string} token
 */
const delete_webhook = async (token) => {
  assert(typeof token === 'string');
  const response = await post_json(create_endpoint(token, 'deleteWebhook'), {});
  return response;
};


/**
 * @param {string} token
 * @param {object} body
 */
const set_webhook = async (token, body) => {
  assert(typeof token === 'string');
  assert(body instanceof Object);
  assert(typeof body.url === 'string');
  assert(typeof body.max_connections === 'number');
  assert(body.allowed_updates instanceof Array);
  const response = await post_json(create_endpoint(token, 'setWebhook'), body);
  return response;
};


/**
 * @param {string} token
 * @param {object} body
 */
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


/**
 * @param {string} token
 */
const get_me = async (token) => {
  assert(typeof token === 'string');
  const response = await post_json(create_endpoint(token, 'getMe'), {});
  assert(response instanceof Object);
  assert(response.result instanceof Object);
  const me = response.result;
  return me;
};


/**
 * @param {string} token
 * @param {object} body
 */
const get_chat_administrators = async (token, body) => {
  assert(typeof token === 'string');
  assert(body instanceof Object);
  assert(typeof body.chat_id === 'number');
  const response = await post_json(create_endpoint(token, 'getChatAdministrators'), body);
  assert(response instanceof Object);
  assert(response.result instanceof Object);
  const chat_administrators = response.result;
  return chat_administrators;
};


// https://core.telegram.org/bots/api#markdownv2-style


/**
 * @param {string} value
 * @returns {string}
 */
const code = (value) => {
  assert(typeof value === 'string');
  return value
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`');
};


/**
 * @param {string} value
 * @returns {string}
 */
const url = (value) => {
  assert(typeof value === 'string');
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\)/g, '\\)');
};


/**
 * @param {string} value
 * @returns {string}
 */
const text = (value) => {
  assert(typeof value === 'string');
  return value
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
};


/**
 * @param  {string[]} values
 * @returns {string}
 */
const lines = (...values) => {
  values.forEach((value) => assert(typeof value === 'string'));
  return values.join('\n');
};


/**
 * @param  {string[]} values
 * @returns {string}
 */
const codes = (...values) => {
  values.forEach((value) => assert(typeof value === 'string'));
  return ['```', ...values, '```'].join('\n');
};


const encode = { code, url, text, lines, codes };


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
  get_chat_administrators,
  encode,
};