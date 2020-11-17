const assert = require('assert');
const got = require('got');

const normalize_phone_number = (raw_phone_number) => {
  assert(typeof raw_phone_number === 'string', 'Invalid parameter type for "raw_phone_number".');
  let phone_number = raw_phone_number.trim();
  for (let i = 0, l = phone_number.length; i < l; i += 1) {
    assert(Number.isNaN(Number(phone_number.charAt(i))) === false, 'Phone number must only contain numbers.');
  }
  assert(phone_number.length === 11 || phone_number.length === 12, 'Phone number must be 11 or 12 characters.');
  if (phone_number.length === 11) {
    assert(phone_number.substring(0, 2) === '09', 'Phone number with 11 characters must start with "09"');
  }
  if (phone_number.length === 12) {
    assert(phone_number.substring(0, 2) === '639', 'Phone number with 12 characters must start with "639"');
    phone_number = '09'.concat(phone_number.substring(2));
  }
  return phone_number;
};

const queue = [];

let sending = false;

const send_next_message = async () => {
  const [apikey, number, message, resolve, reject] = queue.shift();
  assert(typeof apikey === 'string');
  assert(typeof number === 'string');
  assert(typeof message === 'string');
  assert(resolve instanceof Function);
  assert(reject instanceof Function);
  try {
    const semaphore_endpoint = 'https://api.semaphore.co/api/v4/messages';
    const response = await got.post(semaphore_endpoint, {
      json: { apikey, number, message },
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

const send_message = (apikey, raw_phone_number, message) => new Promise((resolve, reject) => {
  assert(typeof apikey === 'string', 'Invalid parameter type for "apikey".');
  assert(typeof raw_phone_number === 'string', 'Invalid parameter type for "raw_phone_number".');
  assert(typeof message === 'string', 'Invalid parameter type for "message".');
  const number = normalize_phone_number(raw_phone_number);
  queue.push([apikey, number, message, resolve, reject]);
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