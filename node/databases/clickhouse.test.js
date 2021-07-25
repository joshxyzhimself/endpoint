
// @ts-check

const clickhouse = require('./clickhouse');


process.nextTick(async () => {


  const clickhouse_host = 'localhost';
  const clickhouse_port = 8123;
  const clickhouse_database = 'test_database';
  const clickhouse_options = {};


  const ch_client = await clickhouse.create_ch_client(
    clickhouse_host,
    clickhouse_port,
    clickhouse_database,
    clickhouse_options,
  );


  const clickhouse_table = 'test_table';


  console.log('Dropping database..');
  await ch_client.database_drop();


  console.log('Creating database..');
  await ch_client.database_create();


  console.log('Creating table..');
  await ch_client.query(`
    CREATE TABLE IF NOT EXISTS "${clickhouse_database}"."${clickhouse_table}" (
      "test_column" String,
      "test_column2" String
    )
    ENGINE MergeTree()
    ORDER BY tuple();
  `);


  const databases_response = await ch_client.databases_show();
  console.log('databases_response');
  console.log(databases_response.body.json);


  const tables_response = await ch_client.tables_show();
  console.log('tables_response');
  console.log(tables_response.body.json);


  const describe_response = await ch_client.table_describe(clickhouse_table);
  console.log('describe_response');
  console.log(describe_response.body.json);


  const insert_response = await ch_client.table_insert_rows(clickhouse_table, [
    { test_column: 'foo', test_column2: 'bar' },
    { test_column: 'foo2', test_column2: 'bar2' },
  ]);
  console.log('insert_response');
  console.log(insert_response.body.json);


  const select_response = await ch_client.query(`
    SELECT * FROM "${clickhouse_database}"."${clickhouse_table}";
  `);
  console.log('select_response');
  console.log(select_response.body.json);
});