
const got = require('got');
const normalize_phone_number = require('../common/normalize_phone_number');
const assert = require('../core/assert');

const queue = [];

let sending = false;

const send_next_message = async () => {
  const [apikey, number, message, sendername, resolve, reject] = queue.shift();
  assert(typeof apikey === 'string');
  assert(typeof number === 'string');
  assert(typeof message === 'string');
  assert(sendername === undefined || typeof sendername === 'string');
  assert(resolve instanceof Function);
  assert(reject instanceof Function);
  try {
    const semaphore_endpoint = 'https://api.semaphore.co/api/v4/messages';
    const response = await got.post(semaphore_endpoint, {
      json: { apikey, number, message, sendername },
    }).json();
    assert(response instanceof Object);
    resolve(response);
  } catch (e) {
    console.error(`@semaphore, ${e.message}`);
    reject(e);
  }
  if (queue.length > 0) {
    setTimeout(send_next_message, 2125); // 28 messages per minute
  } else {
    sending = false;
  }
};

const send_message = (apikey, raw_phone_number, message, sendername) => new Promise((resolve, reject) => {
  assert(typeof apikey === 'string', 'Invalid parameter type for "apikey".');
  assert(typeof raw_phone_number === 'string', 'Invalid parameter type for "raw_phone_number".');
  assert(typeof message === 'string', 'Invalid parameter type for "message".');
  assert(sendername === undefined || typeof sendername === 'string', 'Invalid parameter type for "sendername".');
  const number = normalize_phone_number(raw_phone_number);
  queue.push([apikey, number, message, sendername, resolve, reject]);
  if (sending === false) {
    sending = true;
    process.nextTick(send_next_message);
  }
});

const check_balance = async (apikey) => {
  assert(typeof apikey === 'string', 'Invalid parameter type for "apikey".');
  const semaphore_endpoint = `https://api.semaphore.co/api/v4/account?apikey=${apikey}`;
  const response = await got.get(semaphore_endpoint).json();
  assert(response instanceof Object, 'Invalid response type for "check_balance".');
  const credit_balance = Number(response.credit_balance);
  assert(typeof credit_balance === 'number' && Number.isFinite(credit_balance) === true, 'Invalid response type for "check_balance".');
  return credit_balance;
};

module.exports = { normalize_phone_number, send_message, check_balance };