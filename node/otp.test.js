
const otp = require('./otp');

const key = otp.hotp_create_key();
console.log({ key });

const latest_code = otp.hotp_derive_code(key, otp.totp_get_counter());
console.log({ latest_code });

const recent_code_1 = otp.hotp_derive_code(key, otp.totp_get_counter() - 1);
console.log({ recent_code_1 });

const recent_code_2 = otp.hotp_derive_code(key, otp.totp_get_counter() - 2);
console.log({ recent_code_2 });

const validate_latest_code = otp.totp_verify_code(key, latest_code, 1);
console.log({ validate_latest_code });

const validate_recent_code_1 = otp.totp_verify_code(key, recent_code_1, 1);
console.log({ validate_recent_code_1 });

const validate_recent_code_2 = otp.totp_verify_code(key, recent_code_2, 1);
console.log({ validate_recent_code_2 });