# reset.js — Database Reset Tool (Explained for Rebuilding)

---

## 1. What this file is

A development utility: one request **erases the database and loads sample data**. It makes testing easy because you can always return to a known state.

| Item | Value |
|---|---|
| URL | `POST /reset` |
| Body | none |
| Success | `204 No Content` |
| Auth | **None** (dangerous, see section 6) |

## 2. Imports

```js
import { sequelize } from '../models/index.js';        // DB connection
import { Product, DeliveryOption, CartItem, Order } from '../models/...';
import { defaultProducts } from '../defaultData/defaultProducts.js';
import { defaultDeliveryOptions } from '../defaultData/defaultDeliveryOptions.js';
import { defaultCart } from '../defaultData/defaultCart.js';
import { defaultOrders } from '../defaultData/defaultOrders.js';
```

The `defaultData` files each export an array of plain objects matching the models (these files are not uploaded, you must write them).

## 3. Step-by-step

### Step 1 — rebuild the tables

```js
await sequelize.sync({ force: true });
```

`sync` creates the tables from the models. `force: true` first **drops** every table. After this all tables are empty and have the current structure. In other stacks: run migrations from scratch (`migrate:fresh`, `flask db downgrade/upgrade`, `DROP SCHEMA` + `CREATE SCHEMA`).

### Step 2 — one timestamp

```js
const timestamp = Date.now();
```

### Step 3 — add timestamps to each default row

```js
const productsWithTimestamps = defaultProducts.map((product, index) => ({
  ...product,
  createdAt: new Date(timestamp + index),
  updatedAt: new Date(timestamp + index)
}));
```

`index` is added as milliseconds so every row gets a **slightly different** `createdAt`. That keeps the original order of the sample data when sorting by creation time. The same is done for delivery options, cart items and orders.

`...product` (spread) copies all fields of the default object into a new object, then adds the two timestamps.

### Step 4 — insert

```js
await Product.bulkCreate(productsWithTimestamps);
await DeliveryOption.bulkCreate(deliveryOptionsWithTimestamps);
await CartItem.bulkCreate(cartItemsWithTimestamps);
await Order.bulkCreate(ordersWithTimestamps);
```

`bulkCreate` inserts many rows in one query. The order of these lines matters: **products and delivery options first**, because cart items and orders point to them.

### Step 5 — respond

```js
res.status(204).send();
```

## 4. Pseudocode

```
POST /reset:
    drop all tables and recreate them
    now = current time in ms
    for each of [products, deliveryOptions, cartItems, orders]:
        rows = defaults.map((row, i) => row + {createdAt: now + i, updatedAt: now + i})
        insert rows (parents first)
    return 204
```

## 5. What the seed data should contain

| File | Content |
|---|---|
| defaultProducts | ~10–50 products with name, image, priceCents, keywords, rating, stock, description |
| defaultDeliveryOptions | ids `"1"`, `"2"`, `"3"` with days and priceCents |
| defaultCart | cart rows with a valid `userId`, existing `productId`, quantity, `deliveryOptionId` |
| defaultOrders | orders with `userId`, `orderTimeMs`, `totalCostCents`, `products` lines |

If `userId` values don't exist as profiles, those orders show `userEmail: null` in the admin panel.

## 6. DANGER — read this before deploying

- The route has **no authentication**. Anyone who can reach the server can wipe all data.
- `force: true` drops *every* table registered on the same Sequelize instance, including users' profiles and chat messages.

Protect it with at least one of:

```js
if (process.env.NODE_ENV !== 'production') app.use('/reset', resetRouter);
// or
router.post('/', requireAuth, requireAdmin, handler);
```

Or delete the route in production builds. Many projects expose it only under a flag like `ENABLE_TEST_RESET=true`.

## 7. Rebuild notes

- **Testing:** this is the equivalent of `beforeEach(resetDatabase)` in integration/e2e tests (Cypress, Playwright, pytest). Keep it for those.
- **Seed scripts:** in other ecosystems use `npm run seed`, `php artisan db:seed`, `python manage.py loaddata`, Prisma `db seed`, EF Core `HasData`.
- **Safer than dropping:** `TRUNCATE ... CASCADE` then insert, or run each test in a transaction and roll back.
- **SQLite or in-memory DB** makes resets instant for development.

## 8. Test checklist

- [ ] After calling it, `GET /products` returns the default products
- [ ] Cart and orders match the default data
- [ ] Calling it twice gives the same result
- [ ] In production mode the route is unavailable or admin-only
