
// @ts-check

//
// https://datatracker.ietf.org/doc/html/rfc4226
//
// The algorithm MUST use a strong shared secret.  The length of
// the shared secret MUST be at least 128 bits.  This document
// RECOMMENDs a shared secret length of 160 bits.
//
// 20 bytes = 160 bits
//

const base32 = require('./base32');
const random_bytes = require('../node/random_bytes');

process.nextTick(async () => {
  const bytes = random_bytes(20);
  const response = base32.encode(bytes);
  const response2 = response.split('')
    .reduce((previous, current, current_index) => {
      if (current_index % 4 === 0) {
        previous.push(current);
      } else {
        const last_index = previous.length - 1;
        const last = previous[last_index];
        previous[last_index] = last.concat(current);
      }
      return previous;
    }, [])
    .join(' ');
  const response3 = base32.decode(response);
  console.log({ bytes, response, response2, response3 });
});