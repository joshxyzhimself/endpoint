
# Telegram Utilities (telegram.js)

## usage

```js
const telegram = require('endpoint/node/telegram');
```

## usage

```js
// Sending message
const telegram_token = '';
const chat_id = '';
const text = '';
await telegram.send_message(telegram_token, { chat_id, text });
```

```js
// Sending photo
const telegram_token = '';
const chat_id = '';
const photo = Buffer.from([]);
const caption = '';
await telegram.send_photo(telegram_token, { chat_id, photo });
```

```js
// Deleting message
const telegram_token = '';
const chat_id = '';
const message_id = '';
await telegram.delete_message(telegram_token, { chat_id, message_id });
```