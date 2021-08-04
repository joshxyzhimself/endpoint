
// @ts-check


const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');
const child_process = require('child_process');
const postgres = require('postgres');
const luxon = require('luxon');
const assert = require('../../core/assert');
const rl_question = require('../rl_question');

/**
 * @param {string} postgres_host
 * @param {number} postgres_port
 * @param {string} postgres_username
 * @param {string} postgres_password
 * @param {string} postgres_database
 */
const create_pg_client = (postgres_host, postgres_port, postgres_username, postgres_password, postgres_database) => {
  assert(typeof postgres_host === 'string');
  assert(typeof postgres_port === 'number');
  assert(typeof postgres_username === 'string');
  assert(typeof postgres_password === 'string');
  assert(typeof postgres_database === 'string');
  const postgres_config = {
    host: postgres_host,
    port: postgres_port,
    username: postgres_username,
    password: postgres_password,
    database: postgres_database,
    max: 16,
    idle_timeout: 0,
    types: { // https://github.com/porsager/postgres/issues/161#issuecomment-801031062
      date: {
        to: 1184,
        from: [1082, 1083, 1114, 1184],
        serialize: (value) => value,
        parse: (value) => luxon.DateTime.fromSQL(value).toISO(),
      },
    },
  };


  const client = postgres(postgres_config);
  const encode_database_name = client;
  const encode_array = client.array;
  assert(encode_database_name instanceof Function);
  assert(encode_array instanceof Function);


  const drop_table = async (table) => {
    assert(typeof table === 'string');
    const response = await client`
      DROP TABLE IF EXISTS ${encode_database_name(table)} CASCADE;
    `;
    return response;
  };



  // postgresql.org/docs/13/libpq-pgpass.html
  const pgpass_file_path = path.join(os.homedir(), '.pgpass');
  const pgpass_file_data = `${postgres_host}:${postgres_port}:*:${postgres_username}:${postgres_password}`;
  const create_pgpass = () => {
    fs.writeFileSync(pgpass_file_path, pgpass_file_data);
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
      create_pgpass();
      const dump_file_name = `${postgres_database}-${luxon.DateTime.local().toFormat('LLL-dd-yyyy-ZZZZ-hh-mm-ss-SSS-a')}.dump`;
      const dump_file_directory = path.join(process.cwd(), 'temp');
      const dump_file_path = path.join(process.cwd(), 'temp', dump_file_name);
      fs.mkdirSync(dump_file_directory, { recursive: true });
      const args = [
        `--host=${postgres_host}`,
        `--port=${postgres_port}`,
        `--username=${postgres_username}`,
        `--dbname=${postgres_database}`,
        `--file=${dump_file_path}`,
        '--format=custom',
        '--compress=9',
      ];
      const pg_dump_process = child_process.spawn('pg_dump', args, { stdio: 'inherit' });
      pg_dump_process.on('error', (e) => {
        console.error(`pg_dump_process "error" event: ${e.message}`);
        console.error(e);
      });
      pg_dump_process.on('close', (code, signal) => {
        unlink_pgpass();
        if (code === 0) {
          resolve(dump_file_path);
        } else {
          reject(new Error(`pg_dump_process "close" event, code ${code} signal ${signal}`));
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
    const confirmation = await rl_question('pg_restore: confirm with "yes":');
    assert(confirmation === 'yes');
    await pg_dump();
    return new Promise((resolve, reject) => {
      try {
        assert(typeof dump_file_path === 'string');
        fs.accessSync(dump_file_path, fs.constants.R_OK);
        create_pgpass();
        const args = [
          `--host=${postgres_host}`,
          `--port=${postgres_port}`,
          `--username=${postgres_username}`,
          `--dbname=${postgres_database}`,
          '--single-transaction',
          '--clean',
          dump_file_path,
        ];
        const pg_restore_process = child_process.spawn('pg_restore', args, { stdio: 'inherit' });
        pg_restore_process.on('error', (e) => {
          console.error(`pg_restore_process "error" event: ${e.message}`);
          console.error(e);
        });
        pg_restore_process.on('close', (code, signal) => {
          unlink_pgpass();
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`pg_restore_process "close" event, code ${code} signal ${signal}`));
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
      commands.forEach((command) => {
        assert(typeof command === 'string');
      });
      create_pgpass();
      const args = [
        `--host=${postgres_host}`,
        `--port=${postgres_port}`,
        `--username=${postgres_username}`,
        '--pset=pager=0',
        ...commands.map((command) => `--command=${command}`),
      ];
      const psql_process = child_process.spawn('psql', args, { stdio: 'inherit' });
      psql_process.on('error', (e) => {
        console.error(`psql_process "error" event: ${e.message}`);
        console.error(e);
      });
      psql_process.on('close', (code, signal) => {
        unlink_pgpass();
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`psql_process "close" event, code ${code} signal ${signal}`));
        }
      });
    } catch (e) {
      unlink_pgpass();
      reject(e);
    }
  });


  const pg_client = {
    client,
    drop_table,
    create_pgpass,
    unlink_pgpass,
    pg_dump,
    pg_restore,
    psql,
    encode_database_name,
    encode_array,
  };


  return pg_client;
};


const postgresql = { create_pg_client };

module.exports = postgresql;