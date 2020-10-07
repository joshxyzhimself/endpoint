const crypto = require('crypto');
const got = require('got');
const jose = require('jose');

const maintainer_email = '';
const subscriber_email = '';
const customer_email = '';
const rfc7231_user_agent = '';

const key_pair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
});

const key_pair_public_key = key_pair.publicKey;
const key_pair_private_key = key_pair.privateKey;

console.log({ key_pair_public_key, key_pair_private_key });

(async () => {
  const production_url = 'https://acme-v02.api.letsencrypt.org';
  const staging_url = 'https://acme-staging-v02.api.letsencrypt.org';
  const environment_url = staging_url;
  const environment_directory_url = environment_url.concat('/directory');
  const environment_nonce_url = environment_url.concat('/acme/new-nonce');
  const nonce_response = await got.get(environment_nonce_url);
  const nonce = nonce_response.headers['replay-nonce'];
  console.log({ nonce });
})();
