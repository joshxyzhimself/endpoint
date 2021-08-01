
// @ts-check

// - https://javascript.info/cookie
// - https://developer.mozilla.org/en-US/docs/Web/API/document/cookie

const assert = require('../core/assert');


const one_second_s = 1;
const one_minute_s = one_second_s * 60;
const one_hour_s = one_minute_s * 60;
const one_day_s = one_hour_s * 24;


/**
 * @param {string} key
 * @returns {string}
 */
const get = (key) => {
  assert(typeof key === 'string');
  const key2 = `${key}=`;
  const cookies = document.cookie.split(';');
  for (let i = 0, l = cookies.length; i < l; i += 1) {
    const cookie = cookies[i];
    if (cookie.substring(0, key2.length) === key2) {
      const value = cookie.substring(key2.length);
      return value;
    }
  }
  return null;
};


/**
 * @param {string} key
 * @param {string} value
 */
const set = (key, value) => {
  assert(typeof key === 'string');
  assert(typeof value === 'string');
  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)};path=/;samesite=strict;max-age=${one_day_s}`;
};


/**
 * @param {string} key
 */
const unset = (key) => {
  assert(typeof key === 'string');
  document.cookie = `${encodeURIComponent(key)}=;path=/;samesite=strict;max-age=-1`;
};


const cookiez = { get, set, unset };

module.exports = cookiez;