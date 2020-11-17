
const assert = require('assert');
const mailgun = require('./mailgun');
const config = require('./config');

assert(typeof config.mailgun_domain === 'string');
assert(typeof config.mailgun_password === 'string');
assert(typeof config.mailgun_from === 'string');
assert(typeof config.mailgun_to === 'string');
const mailgun_subject = 'Subject # 1234';
const mailgun_text = 'Text # 1234';

(async () => {
  const response = await mailgun.send_message(config.mailgun_domain, config.mailgun_password, config.mailgun_from, config.mailgun_to, mailgun_subject, mailgun_text);
  console.log({ response });
})();