
// @ts-check

const clickhouse = require('./clickhouse');


process.nextTick(async () => {
  const ch_client = await clickhouse.create_ch_client('localhost', 8123, 'default');
  const databases = await ch_client.show_databases();
  console.log(databases.body.json);
  const tables = await ch_client.show_tables();
  console.log(tables.body.json);
  const select_1 = await ch_client.query('SELECT 1;');
  console.log(select_1.body.json);
});