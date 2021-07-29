
const fs = require('fs');
const path = require('path');
const assert = require('../core/assert');
const telegram = require('./telegram');
const json = require('./json');


const config = json.read(json.from_cwd('test.config.json'));


assert(typeof config.telegram_chat_id === 'number');
const telegram_chat_id = config.telegram_chat_id;


assert(typeof config.telegram_token === 'string');
const telegram_token = config.telegram_token;


const test_image_path = path.join(process.cwd(), 'test.png');
const test_image_buffer = fs.readFileSync(test_image_path);


process.nextTick(async () => {


  const response = await telegram.get_me(telegram_token);
  console.log({ response });


  await telegram.send_message(telegram_token, {
    chat_id: telegram_chat_id,
    parse_mode: 'MarkdownV2',
    text: 'test',
  });


  await telegram.send_photo(telegram_token, {
    chat_id: telegram_chat_id,
    parse_mode: 'MarkdownV2',
    caption: 'test',
    photo: test_image_buffer,
  });
});