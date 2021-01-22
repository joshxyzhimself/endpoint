
// 01-23-2021

const assert = require('assert');
const worker_threads = require('worker_threads');

const telegram = require('./telegram');
const config = require('../node/config');

assert(typeof config.domain_name === 'string');
const domain_name = config.domain_name;

assert(typeof config.telegram_token === 'string');
const telegram_token = config.telegram_token;

assert(typeof config.environment === 'string');
const environment = config.environment;


if (worker_threads.isMainThread === true) {

  const process_update = async (update) => {
    assert(update instanceof Object);
    try {
      if (update.message instanceof Object === false) {
        return;
      }

      // https://core.telegram.org/bots/api#message
      const message = update.message;
      assert(message.from instanceof Object);
      assert(message.chat instanceof Object);

      // https://core.telegram.org/bots/api#user
      const user_id = message.from.id;

      // https://core.telegram.org/bots/api#chat
      const chat_id = message.chat.id;

      if (typeof message.text === 'string') {
        const text = message.text;

        const response_text = `${user_id} ${chat_id} ${text}`;
        await telegram.send_message(telegram_token, { chat_id, text: response_text });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const get_updates = async (offset) => {
    console.log(`get_updates: ${offset}`);
    const updates = await telegram.get_updates(telegram_token, { offset, allowed_updates: ['message'] });
    updates.forEach(process_update);
    await telegram.sleep(5000);
    const next_offset = updates.length === 0 ? undefined : updates[updates.length - 1].update_id + 1;
    process.nextTick(get_updates, next_offset);
  };

  if (environment === 'production') {
    process.nextTick(async () => {
      await telegram.delete_webhook(telegram_token);
      await telegram.set_webhook(telegram_token, {
        url: `https://${domain_name}:${443}/telegram-webhook`,
        max_connections: 100,
        allowed_updates: ['message'],
      });
    });
  } else {
    process.nextTick(async () => {
      await telegram.delete_webhook(telegram_token);
      process.nextTick(get_updates);
    });
  }
}
