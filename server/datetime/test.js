const datetime = require('./index');

datetime.set_tz('utc');
console.log('current', datetime.current_dt().toISO());
console.log('next 1 minute', datetime.next_dt(1, 'minute').toISO());
console.log('next 5 minutes', datetime.next_dt(5, 'minutes').toISO());
console.log('next 1 hour', datetime.next_dt(1, 'hour').toISO());
console.log('next 5 hours', datetime.next_dt(5, 'hours').toISO());
console.log('next 1 day', datetime.next_dt(1, 'day').toISO());
console.log('next 5 days', datetime.next_dt(5, 'days').toISO());

datetime.set_tz('local');
console.log('current', datetime.current_dt().toISO());
console.log('next 1 minute', datetime.next_dt(1, 'minute').toISO());
console.log('next 5 minutes', datetime.next_dt(5, 'minutes').toISO());
console.log('next 1 hour', datetime.next_dt(1, 'hour').toISO());
console.log('next 5 hours', datetime.next_dt(5, 'hours').toISO());
console.log('next 1 day', datetime.next_dt(1, 'day').toISO());
console.log('next 5 days', datetime.next_dt(5, 'days').toISO());