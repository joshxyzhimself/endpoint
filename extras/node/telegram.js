const assert = require('assert');
const got = require('got');

const send_message = async (token, chat_id, text, disable_notification) => {
  assert(typeof token === 'string', 'Invalid parameter type for "token".');
  assert(typeof chat_id === 'string', 'Invalid parameter type for "chat_id".');
  assert(typeof text === 'string', 'Invalid parameter type for "text".');
  assert(disable_notification === undefined || typeof disable_notification === 'boolean', 'Invalid parameter type for "disable_notification".');
  const telegram_endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await got.post(telegram_endpoint, {
    json: {
      text,
      chat_id,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      disable_notification: disable_notification || false,
    },
  }).json();
  assert(response instanceof Object, 'Invalid response type for "send_message".');
  return response;
};

const concat_messages = (...messages) => {
  messages.forEach((message) => assert(typeof message === 'string', 'Invalid parameter type for "message".'));
  return `<pre>${messages.map((message) => message.trim()).join('\n')}</pre>`;
};

module.exports = { send_message, concat_messages };
