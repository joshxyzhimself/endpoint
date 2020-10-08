
const scrypt = require('./index');

(async () => {
  const username = 'alice_123';
  const username_is_safe = scrypt.safe_username_regex.test(username);
  const password = 'alice-password';
  const password_salt = scrypt.create_salt();
  const password_key = await scrypt.derive_key(password, password_salt);
  console.log({ username, username_is_safe, password, password_salt, password_key });
})();