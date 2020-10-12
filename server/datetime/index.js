const assert = require('assert');
const luxon = require('luxon');

/**
 * @param {String} time_zone
 */
const set_tz = (time_zone) => {
  console.log({ time_zone });
  assert(typeof time_zone === 'string', 'set_tz(time_zone), "time_zone" must be a string.');
  assert(luxon.DateTime.local().setZone(time_zone).isValid === true, 'set_tz(time_zone), "time_zone" must be valid.');
  luxon.Settings.defaultZoneName = time_zone;
  return luxon.Settings.defaultZoneName;
};

/**
 * @param {luxon.DateTime} datetime
 */
const to_iso = (datetime) => {
  assert(luxon.DateTime.isDateTime(datetime) === true, 'to_iso(datetime), "datetime" must be a DateTime object.');
  return datetime.toISO();
};

/**
 * @param {String} iso_datetime
 */
const from_iso = (iso_datetime) => {
  assert(typeof iso_datetime === 'string', 'from_iso(iso_datetime), "iso_datetime" must be a string.');
  const datetime = luxon.DateTime.fromISO(iso_datetime);
  assert(datetime.isValid === true, 'from_iso(iso_datetime), "iso_datetime" must be valid.');
  return datetime;
};

const current_dt = () => {
  return luxon.DateTime.local();
};

const time_units = new Set(['day', 'days', 'hour', 'hours', 'minute', 'minutes', 'second', 'seconds']);

/**
 * @param {Number} time_unit_amount
 * @param {String} time_unit
 */
const next_dt = (time_unit_amount, time_unit) => {
  assert(Number.isInteger(time_unit_amount) === true && time_unit_amount > 0, 'next_dt(time_unit_amount, time_unit), "time_unit_amount" must be an integer > 0.');
  assert(typeof time_unit === 'string', 'next_dt(time_unit_amount, time_unit), "time_unit" must be a string.');
  assert(time_units.has(time_unit) === true, 'next_dt(time_unit_amount, time_unit), "time_unit" must be "day(s)", "hour(s)", "minute(s)", or "second(s)"');

  const current = luxon.DateTime.local();

  switch (time_unit) {
    case 'day':
    case 'days': {
      const next = current.set({
        day: current.day - current.day % time_unit_amount,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      }).plus({ days: time_unit_amount });
      return next;
    }
    case 'hour':
    case 'hours': {
      const next = current.set({
        hour: current.hour - current.hour % time_unit_amount,
        minute: 0,
        second: 0,
        millisecond: 0,
      }).plus({ hours: time_unit_amount });
      return next;
    }
    case 'minute':
    case 'minutes': {
      const next = current.set({
        minute: current.minute - current.minute % time_unit_amount,
        second: 0,
        millisecond: 0,
      }).plus({ minutes: time_unit_amount });
      return next;
    }
    case 'second':
    case 'seconds': {
      const next = current.set({
        second: current.second - current.second % time_unit_amount,
        millisecond: 0,
      }).plus({ seconds: time_unit_amount });
      return next;
    }
    default: {
      return null;
    }
  }
};

module.exports = { set_tz, to_iso, from_iso, current_dt, next_dt };
