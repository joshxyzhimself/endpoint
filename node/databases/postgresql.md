# postgresql

## pgpass

- postgresql.org/docs/13/libpq-pgpass.html

## psql

- https://www.postgresql.org/docs/13/app-psql.html

```js
await postgresql.psql(`\\c "${postgresql.database}";`, 'SELECT * FROM "members" LIMIT 5;');
await postgresql.psql('DROP DATABASE IF EXISTS "yolo";');
await postgresql.psql('CREATE DATABASE "yolo";');
await postgresql.psql('\\list');
```

## pg_dump

- https://www.postgresql.org/docs/13/app-pgdump.html

```js
const dump_file_path = await postgresql.pg_dump();
```

## pg_restore

- https://www.postgresql.org/docs/13/app-pgrestore.html

```js
await postgresql.pg_restore(dump_file_path);
```