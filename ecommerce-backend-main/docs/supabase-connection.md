# How my backend connects to Supabase (the cloud database)

This document explains **how we moved from a local SQLite file to a Postgres database in the cloud (Supabase)**, what each setting is for, and **why I still have to run the server** even though the database is online.

---

## 1. The big picture

There are **three separate pieces**, and only one of them lives in the cloud:

```
 Browser (React)  --->  My Express server  --->  Supabase
 (what people see)      (my backend, runs        (the database in the cloud,
                         with npm start)          plus the login service)
```

| Piece | What it does | Where it runs |
|---|---|---|
| **Browser / React** | draws the pages, sends requests | the visitor's browser |
| **Express server** (`server.js`) | the rules: who is logged in, stock, orders, admin | **my PC** (until I deploy it) |
| **Supabase Postgres** | stores the data (products, carts, orders...) | Supabase's servers, in the cloud |
| **Supabase Auth** | stores emails and passwords, gives login tokens | Supabase's servers, in the cloud |

Before: the database was a **file** (`database.sqlite`) next to my server.
Now: the database is **another computer on the internet**, and my server calls it over the network.

---

## 2. Two different connections to Supabase

This confused me at first, so remember it: my backend talks to Supabase in **two different ways**, with **different settings**.

| | Connection 1: the **database** | Connection 2: the **login (Auth)** |
|---|---|---|
| What for | read and write products, carts, orders | check who a login token belongs to |
| Used by | Sequelize (`models/index.js`) | `@supabase/supabase-js` (`middleware/auth.js`) |
| Needs | host, user, password, database name, port | project **URL** + **publishable key** |
| Variables in `.env` | `DB_TYPE`, `RDS_HOSTNAME`, `RDS_USERNAME`, `RDS_PASSWORD`, `RDS_DB_NAME`, `RDS_PORT` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |

The two addresses **look similar but are different**:
- `RDS_HOSTNAME` is the **Postgres** address (a database host).
- `SUPABASE_URL` is `https://xxxx.supabase.co` (the project's web API address, for Auth).

---

## 3. What we did, step by step

### Step 1: create the Supabase project
In the Supabase dashboard I created a project. Supabase gave me:
- a **Postgres database** (empty),
- a **database password** (the one I chose),
- the **connection details** (in the dashboard's database/connection settings): host, port, user, database name,
- the **Project URL** and the **Publishable key** (in the API keys settings).

### Step 2: put the settings in `.env`
`.env` is a plain text file next to `server.js` that holds the secret settings:

```
DB_TYPE=postgres
RDS_HOSTNAME=...            # the database host from Supabase
RDS_USERNAME=...            # the database user
RDS_PASSWORD=...            # the database password
RDS_DB_NAME=...             # usually "postgres"
RDS_PORT=...                # usually 5432 (or the pooler's port)

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=...       # the PUBLISHABLE key
```
Rules for this file:
- No quotes, no spaces around `=`.
- It is read **only when the server starts**, so **restart after editing it**.
- It must be in **`.gitignore`**. It contains my database password.
- The name `RDS` comes from the course (it used Amazon RDS). For me it simply means "the cloud database".

### Step 3: install the Postgres driver
Sequelize needs a small library to speak to Postgres:
```
npm install pg
```
(The library for Auth is `npm install @supabase/supabase-js`.)

### Step 4: `models/index.js` reads the settings and connects
```js
const isUsingRDS = process.env.RDS_HOSTNAME && process.env.RDS_USERNAME && process.env.RDS_PASSWORD;
const dbType = process.env.DB_TYPE || 'mysql';
```
- `process.env.X` reads a value from `.env`.
- `isUsingRDS` is true only if host, user and password all exist.
- `dbType` is the kind of database. **If `DB_TYPE` is missing it says `'mysql'`**, which is wrong for Supabase. That's why `DB_TYPE=postgres` is needed.

```js
if (isUsingRDS) {
  const dialectOptions = {};
  if (dbType === 'postgres') {
    dialectOptions.ssl = { require: true, rejectUnauthorized: false };
  }
  sequelize = new Sequelize({
    database: process.env.RDS_DB_NAME,
    username: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    host: process.env.RDS_HOSTNAME,
    port: process.env.RDS_PORT || defaultPort,
    dialect: dbType,
    dialectOptions,
    logging: false
  });
}
```
- `host` + `port` = **where** the database is (an address on the internet).
- `username` + `password` = **who I am** (the database login).
- `database` = which database inside that server.
- `dialect: 'postgres'` = which language to speak.
- **`ssl`** = encrypt the connection. **Supabase requires it.** Without it the connection is refused.
- `else` branch: if those settings are missing, it **silently** uses a local SQLite instead.

### Step 5: `server.js` loads `.env` and builds the tables
```js
import 'dotenv/config';
...
await sequelize.sync({ alter: true });
```
- `import 'dotenv/config'` reads `.env` into `process.env`. It must come **before** any file that uses those values.
- `sequelize.sync({ alter: true })` looks at every model and **creates the missing tables / columns in Supabase**. That is how `Products`, `Orders`, `Profiles`... appeared in the Table Editor without writing any SQL. (`alter` keeps the data; `force` would delete it.)
- Then the seed block fills the tables **only if `Products` is empty**.

### Step 6: moving my real data
My first start with Supabase failed with a **foreign key error**:
SQLite doesn't enforce foreign keys, Postgres does, so a cart item pointing to a missing product was rejected.
What we did:
1. Read the real data out of `database.sqlite`.
2. Rebuilt the four `defaultData/*.js` files from it (checking for orphans).
3. Ran `POST /api/reset` **once** to wipe the placeholder rows and load the real ones.
4. Then **deleted the reset route** (it drops every table).

### Step 7: connecting the login (Auth)
`middleware/auth.js`:
```js
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
```
Every request with a token is checked with `supabase.auth.getUser(token)`. The frontend has its own copy of the URL and key, with the `VITE_` prefix (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

### Step 8: check it worked
- The terminal prints `Server is running on port 3000` and **no connection error**.
- In Supabase -> Table Editor, the tables exist and have rows.
- `http://localhost:3000/api/products` returns the products.

---

## 4. Why do I still need `npm start` if the database is in the cloud?

**Short answer: the database only stores data. It can't run my code.** The server is the part that holds all my rules, and that part is still on my PC.

### The restaurant picture
- **Supabase** is the **warehouse**: shelves full of stuff. It stores things, but it doesn't know how my store works.
- **My Express server** is the **shop staff**: it decides who can come in, checks the stock, charges, creates orders, lets only admins edit.
- **The browser** is the **customer**.

A warehouse can't serve customers by itself. And customers don't walk into the warehouse.

### What only the server does
| Thing | Where the code is |
|---|---|
| check the login token and the role | `middleware/auth.js` |
| "can't add more than the stock" | `routes/cartItems.js` |
| take the stock out and create the order safely | `routes/orders.js` |
| "only admins can delete a product" | `routes/products.js` |
| calculate totals | `routes/paymentSummary.js` |
| send the website files (`dist`) | `server.js` |

The Supabase database knows **nothing** about these rules. If the server isn't running, nobody is applying them.

### Why the browser doesn't talk to the database directly
- It would need the **database password** inside the frontend code, and anyone can read frontend code.
- It would **skip all my rules**: anyone could change prices or read other people's orders.
- (Supabase *can* be used straight from the browser, but only with a different design called Row Level Security, where the rules live **inside the database**. My project keeps its rules in Express instead.)

### What each thing needs to be running
| Situation | What happens |
|---|---|
| My PC is off, server stopped | the **website is down**, but **no data is lost**. It all sits safely in Supabase |
| Server running, internet off | the server can't reach the database, so requests fail with 500 |
| Server running + Supabase | everything works |

### Two things to run while developing
1. **The backend** (Express, port 3000): `npm start` or `node server.js`.
2. **The frontend dev server** (Vite, port 5173): `npm run dev`.

In production they become **one**: Express serves the built frontend (`dist`), so you only run the server.

### How to stop needing my PC: deploy the backend
"Deploying" = running the **same Express server on someone else's computer** (Render, Railway, Fly.io...) that stays on 24/7. Then the whole chain is in the cloud:

```
Browser  --->  Express on a host (always on)  --->  Supabase
```

On the host I set the same `.env` values in its settings page instead of using a `.env` file.

---

## 5. Problems I can hit, and what they mean

| What I see | Usually means |
|---|---|
| `Please install mysql2 package manually` | `DB_TYPE=postgres` is missing, so it picked `mysql` |
| `ENOTFOUND` or `getaddrinfo` | wrong `RDS_HOSTNAME` (typo, or I used the Project URL instead) |
| `ENETUNREACH` or a timeout | the direct connection can use IPv6, which not every network has. Try the **pooler** connection details from the dashboard |
| `password authentication failed` | wrong `RDS_USERNAME` or `RDS_PASSWORD` |
| `no pg_hba.conf entry ... no encryption` / SSL error | the `ssl` option is missing |
| `Key (...) is not present in table` | a foreign key problem (a row points to something that doesn't exist) |
| It works, but my data is gone / empty | the `RDS_` values are missing, so it silently fell back to **SQLite** |
| `supabaseUrl is required` | `SUPABASE_URL` missing (backend) or `VITE_SUPABASE_URL` missing (frontend) |
| `Invalid API key` | the key was copied wrong, or it's the wrong one |
| Everything 401 | the backend `SUPABASE_URL` / key is wrong, or the token isn't being sent |
| I changed `.env` and nothing changed | I forgot to **restart** |

---

## 6. Security checklist
- [ ] `.env` is in `.gitignore` (never upload it to GitHub).
- [ ] Only the **publishable** key is used. **Never** the secret key in frontend or in git.
- [ ] If the database password ever leaks: reset it in Supabase and update `.env`.
- [ ] No `/api/reset`-style route exists.
- [ ] Protected routes use `requireAuth` / `requireAdmin` on the **server**.

---

## 7. Recipe for a new project (connect Express to Supabase)

1. Create a project in Supabase. Copy: database host, port, user, password, database name, Project URL, publishable key.
2. `npm install express sequelize pg cors dotenv @supabase/supabase-js`
3. Create `.env` (and add it to `.gitignore`) with `DB_TYPE=postgres` and the values above.
4. Write `models/index.js` that builds `new Sequelize({... dialect: 'postgres', dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } })`.
5. Write the models, import them in `server.js`.
6. In `server.js`: `import 'dotenv/config'` first, then `await sequelize.sync({ alter: true })`, then `app.listen`.
7. Start the server and check the tables appear in the Supabase Table Editor.
8. Add Auth: `createClient(SUPABASE_URL, key)` and a `requireAuth` middleware.
9. Deploy the backend when you want it online without your PC.

---

## 8. Words I saw

- **Host**: the address of the computer that has the database.
- **Port**: the "door number" on that computer (Postgres normally uses 5432).
- **SSL**: encryption of the connection.
- **Environment variable (`.env`)**: a setting kept outside the code, so secrets aren't in the code.
- **Dialect**: which database language Sequelize speaks (postgres, mysql, sqlite).
- **ORM**: a library (Sequelize) that lets me use tables as JavaScript objects.
- **Pooler**: a Supabase service that shares database connections; it has its own host and port.
- **Seed data**: starting data used to fill an empty database.
- **Deploy**: put my server on another computer that stays on.
