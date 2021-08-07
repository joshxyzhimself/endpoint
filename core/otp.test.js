
// @ts-check


const random_bytes = require('../node/random_bytes');
const base32 = require('./base32');
const otp = require('./otp');


process.nextTick(async () => {
  const bytes = random_bytes(20);
  const bytes_base32 = base32.encode(bytes);
  otp.hotp_derive_code(bytes_base32, 1);
});