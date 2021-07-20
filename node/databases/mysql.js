
// @ts-check


const mysql2 = require('mysql2/promise');
const assert = require('../../core/assert');


const create_connection = async (mysql_host, mysql_username, mysql_password, mysql_database) => {
  const mysql_connection = await mysql2.createConnection({
    host: mysql_host,
    user: mysql_username,
    password: mysql_password,
    database: mysql_database,
  });
  return mysql_connection;
};

/**
 * @param {object} mysql_connection
 * @param {string} table_name
 */
const count_rows = async (mysql_connection, table_name) => {
  assert(mysql_connection instanceof Object);
  assert(mysql_connection.query instanceof Object);
  assert(typeof table_name === 'string');
  const mysql_response = await mysql_connection.query(`SELECT COUNT(*) FROM ${table_name}`);
  const count = mysql_response[0][0]['COUNT(*)'];
  assert(typeof count === 'number' && Number.isNaN(count) === false);
  return count;
};

/**
 * @param {object} mysql_connection
 * @param {string} table_name
 * @param {string | null} where
 * @param {number | null} limit
 * @param {number | null} offset
 */
const get_rows = async (mysql_connection, table_name, where, limit, offset) => {
  assert(mysql_connection instanceof Object);
  assert(mysql_connection.query instanceof Object);
  assert(typeof table_name === 'string');
  assert(where === null || typeof table_name === 'string');
  assert(limit === null || (typeof limit === 'number' && Number.isNaN(limit) === false));
  assert(offset === null || (typeof offset === 'number' && Number.isNaN(offset) === false));
  let mysql_query_string = `SELECT * FROM ${table_name}`;
  if (where !== null) {
    mysql_query_string += ` WHERE ${where}`;
  }
  if (limit !== null) {
    mysql_query_string += ` LIMIT ${limit}`;
  }
  if (offset !== null) {
    mysql_query_string += ` OFFSET ${offset}`;
  }
  mysql_query_string += ';';
  const mysql_response = await mysql_connection.query(mysql_query_string);
  const rows = mysql_response[0];
  assert(rows instanceof Array);
  return rows;
};

const mysql = { create_connection, count_rows, get_rows };

module.exports = mysql;