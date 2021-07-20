
const assert = require('../core/assert');
const semaphore = require('./semaphore');
const config = require('./config');

assert(typeof config.semaphore_apikey === 'string');
assert(typeof config.semaphore_phone_number === 'string');
assert(typeof config.semaphore_sendername === 'string');
const semaphore_message = 'Message # 1234';

(async () => {
  const response = await semaphore.send_message(config.semaphore_apikey, config.semaphore_phone_number, semaphore_message, config.semaphore_sendername);
  console.log({ response });
})();