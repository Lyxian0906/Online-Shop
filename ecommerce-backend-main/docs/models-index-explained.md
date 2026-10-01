# `models/index.js` explained

This file's only job is to create **one `sequelize` object** that every other file imports to talk to the database. The tricky part is that it decides, at startup, *which* database to actually connect to.

## The decision: SQLite or Postgres?

```js
const isUsingRDS = process.env.RDS_HOSTNAME && process.env.RDS_USERNAME && process.env.RDS_PASSWORD;
```

This checks whether three environment variables exist. It doesn't care what they're called in your head ("RDS" = AWS's database service) — it only checks that they're *set*. So pointing these at Supabase works exactly the same as pointing them at real AWS RDS. The name is just a leftover from the AWS lesson.

- If all three exist → `isUsingRDS` is `true` → connect to a real Postgres/MySQL server.
- If any are missing → `isUsingRDS` is `false` → fall back to a local SQLite file.

This means: **no env vars set = works offline with SQLite automatically.** That's why the project ran fine on your machine before you touched Supabase.

## Branch 1: Postgres/MySQL (`isUsingRDS` is true)

```js
sequelize = new Sequelize({
  database: process.env.RDS_DB_NAME,
  username: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  host: process.env.RDS_HOSTNAME,
  port: process.env.RDS_PORT || defaultPort,
  dialect: dbType,       // 'mysql' or 'postgres'
  logging: false
});
```

Straightforward — it builds a connection using whatever you put in your `.env` file. `dbType` comes from `DB_TYPE` (defaults to `'mysql'` if you don't set it, which is why you need `DB_TYPE=postgres` for Supabase).

**One thing this branch is missing for Supabase specifically: SSL.** Supabase refuses plain connections, so you need to add `dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }` when `dbType === 'postgres'`.

## Branch 2: SQLite fallback (`isUsingRDS` is false)

```js
sequelize = new Sequelize({
  dialect: 'sqlite',
  dialectModule: sqlJsAsSqlite3,
  logging: false
});
```

This is unusual — it's not using a normal SQLite file connection. `sql.js-as-sqlite3` is a version of SQLite that runs **entirely in memory**, compiled to run inside Node without native dependencies (handy for cross-platform compatibility, since normal SQLite drivers sometimes need OS-specific binaries).

Because it's in-memory, nothing is saved to disk automatically. That's what the next part fixes.

### The hooks

```js
sequelize.addHook('afterCreate', saveDatabaseToFile);
sequelize.addHook('afterDestroy', saveDatabaseToFile);
// ...and more
```

A "hook" runs a function automatically after some event. Here, after *any* write operation (create, update, delete, bulk versions of each), it calls `saveDatabaseToFile()`.

```js
export async function saveDatabaseToFile() {
  const dbInstance = await sequelize.connectionManager.getConnection();
  const binaryArray = dbInstance.database.export();
  const buffer = Buffer.from(binaryArray);
  fs.writeFileSync('database.sqlite', buffer);
}
```

Since the database only exists in memory, this manually grabs the whole in-memory database, converts it to raw bytes (`export()`), and writes those bytes to `database.sqlite` on disk — overwriting the whole file every time. That's why your SQLite file updates after every cart change, even though the actual database engine never touches the file directly during normal reads/writes.

## Why this matters for your migration

None of this file's *logic* needs to change for Supabase — only the env vars, plus the SSL option. The SQLite branch, with all its in-memory/file-saving complexity, simply never runs once `RDS_*` vars are present, so you don't need to fully understand it to move forward — you just need to know it's there as a fallback.
