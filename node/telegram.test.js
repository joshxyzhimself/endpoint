
const assert = require('assert');
const telegram = require('./telegram');
const config = require('./config');

assert(typeof config.telegram_token === 'string');
assert(typeof config.telegram_chat_id === 'string');
const telegram_text = 'Message # 1234';

(async () => {
  await telegram.send_message(config.telegram_token, config.telegram_chat_id, telegram_text);
  await telegram.send_message(config.telegram_token, config.telegram_chat_id, telegram.concat_messages(telegram_text, telegram_text));
})();