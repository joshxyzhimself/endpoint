/* eslint-disable no-console, camelcase */

const os = require('os');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const process = require('process');
const child_process = require('child_process');
const postgres = require('postgres');
const luxon = require('luxon');
const config = require('../core/config');
const environment_types = require('../environment_types');
const readline_question = require('../readline_question');

assert(typeof config.namespace === 'string');
assert(typeof config.environment === 'string');
assert(typeof config.postgres_host === 'string');
assert(typeof config.postgres_port === 'number');
assert(typeof config.postgres_username === 'string');
assert(typeof config.postgres_password === 'string');

assert(environment_types.has(config.environment) === true);

const namespace = config.namespace;
const environment = config.environment;
const database = `${namespace}-db-${environment}`;

const postgres_config = {
  database,
  host: config.postgres_host,
  port: config.postgres_port,
  username: config.postgres_username,
  password: config.postgres_password,
  max: 16,
  idle_timeout: 2,
};
const client = postgres(postgres_config);

const drop_table = async (table) => {
  assert(typeof table === 'string');
  const response = await client`
    DROP TABLE IF EXISTS ${client(table)} CASCADE;
  `;
  return response;
};

// postgresql.org/docs/13/libpq-pgpass.html
const pgpass_file_path = path.join(os.homedir(), '.pgpass');
const pgpass_data = `${config.postgres_host}:${config.postgres_port}:*:${config.postgres_username}:${config.postgres_password}`;
const create_pgpass = () => {
  fs.writeFileSync(pgpass_file_path, pgpass_data);
  fs.chmodSync(pgpass_file_path, fs.constants.S_IRUSR | fs.constants.S_IWUSR);
};
const unlink_pgpass = () => {
  if (fs.existsSync(pgpass_file_path) === true) {
    fs.unlinkSync(pgpass_file_path);
  }
};

/**
 * @returns {Promise<string>}
 */
const pg_dump = () => new Promise((resolve, reject) => {
  try {
    console.log('pg_dump: START');
    create_pgpass();
    const dump_file_name = `${database}-${luxon.DateTime.local().toFormat('LLL-dd-yyyy-ZZZZ-hh-mm-ss-SSS-a')}.dump`;
    const dump_file_directory = path.join(process.cwd(), 'temp');
    const dump_file_path = path.join(process.cwd(), 'temp', dump_file_name);
    fs.mkdirSync(dump_file_directory, { recursive: true });
    const args = [
      `--host=${config.postgres_host}`,
      `--port=${config.postgres_port}`,
      `--username=${config.postgres_username}`,
      `--dbname=${database}`,
      `--file=${dump_file_path}`,
      '--format=custom',
      '--compress=9',
    ];
    const pg_dump_process = child_process.spawn('pg_dump', args, { stdio: 'inherit' });
    pg_dump_process.on('error', (e) => {
      console.log(`pg_dump: ERROR ${e.message}`);
    });
    pg_dump_process.on('close', (code, signal) => {
      console.log(`pg_dump: CLOSE ${code} ${signal}`);
      unlink_pgpass();
      if (code === 0) {
        resolve(dump_file_path);
      } else {
        reject();
      }
    });
  } catch (e) {
    unlink_pgpass();
    reject(e);
  }
});

/**
 * @param {String} dump_file_path
 * @returns {Promise<void>}
 */
const pg_restore = async (dump_file_path) => {
  const confirmation = await readline_question('pg_restore: CONFIRM with "yes":');
  assert(confirmation === 'yes');
  await pg_dump();
  return new Promise((resolve, reject) => {
    try {
      console.log('pg_restore: START');
      assert(typeof dump_file_path === 'string');
      fs.accessSync(dump_file_path, fs.constants.R_OK);
      create_pgpass();
      const args = [
        `--host=${config.postgres_host}`,
        `--port=${config.postgres_port}`,
        `--username=${config.postgres_username}`,
        `--dbname=${database}`,
        '--single-transaction',
        '--clean',
        dump_file_path,
      ];
      const pg_restore_process = child_process.spawn('pg_restore', args, { stdio: 'inherit' });
      pg_restore_process.on('error', (e) => {
        console.log(`pg_restore: ERROR ${e.message}`);
      });
      pg_restore_process.on('close', (code, signal) => {
        console.log(`pg_restore: CLOSE ${code} ${signal}`);
        unlink_pgpass();
        if (code === 0) {
          resolve();
        } else {
          reject();
        }
      });
    } catch (e) {
      unlink_pgpass();
      reject(e);
    }
  });
};

/**
 * @param  {string[]} commands
 * @returns {Promise<void>}
 */
const psql = (...commands) => new Promise((resolve, reject) => {
  try {
    console.log('psql: START');
    commands.forEach((command) => assert(typeof command === 'string'));
    create_pgpass();
    const args = [
      `--host=${config.postgres_host}`,
      `--port=${config.postgres_port}`,
      `--username=${config.postgres_username}`,
      '--pset=pager=0',
      ...commands.map((command) => `--command=${command}`),
    ];
    const psql_process = child_process.spawn('psql', args, { stdio: 'inherit' });
    psql_process.on('error', (e) => {
      console.log(`psql: ERROR ${e.message}`);
    });
    psql_process.on('close', (code, signal) => {
      console.log(`psql: CLOSE ${code} ${signal}`);
      unlink_pgpass();
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  } catch (e) {
    unlink_pgpass();
    reject(e);
  }
});

const postgresql = { namespace, environment, database, client, drop_table, pg_dump, pg_restore, psql };

module.exports = postgresql;