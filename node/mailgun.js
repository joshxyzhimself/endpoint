const assert = require('assert');
const got = require('got');

const send_message = async (domain, password, from, to, subject, text) => {
  assert(typeof domain === 'string', 'Invalid parameter type for "domain".');
  assert(typeof password === 'string', 'Invalid parameter type for "password".');
  assert(typeof from === 'string', 'Invalid parameter type for "from".');
  assert(typeof to === 'string', 'Invalid parameter type for "to".');
  assert(typeof subject === 'string', 'Invalid parameter type for "subject".');
  assert(typeof text === 'string', 'Invalid parameter type for "text".');

  const mailgun_endpoint = `https://api.mailgun.net/v3/${domain}/messages`;

  const response = await got.post(mailgun_endpoint, {
    username: 'api',
    password,
    form: { from, to, subject, text },
  }).json();

  return response;
};

module.exports = { send_message };