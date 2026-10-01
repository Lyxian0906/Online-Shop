# `server.js` explained

This file wires everything together and starts the server. The confusing part is usually the seeding logic at the bottom — the part that fills the database with starter data.

## The setup (top half)

```js
app.use(cors());
app.use(express.json());
```

- `cors()` lets your frontend (running on a different port, e.g. `5173`) make requests to this backend (e.g. `3000`). Without it, the browser blocks the requests.
- `express.json()` lets Express read JSON bodies — this is what makes `req.body.productId` work in your routes.

```js
app.use('/api/products', productRoutes);
app.use('/api/cart-items', cartItemRoutes);
// ...
```

This is route mounting: any request to `/api/products/...` gets handed to whatever's defined in `routes/products.js`, any request to `/api/cart-items/...` goes to `routes/cartItems.js`, and so on. Each route file only has to know about its own paths (`/`, `/:productId`), not the `/api/products` prefix — Express adds that automatically because of where it's mounted.

```js
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});
```

This is what lets one server serve both the API *and* the built frontend. `dist` is where Vite puts your built React app after `npm run build`. The catch-all route (`'*'`) means: if a request doesn't match any `/api/...` route above it, serve `index.html` instead — this is required for React Router to work on page refresh (e.g. visiting `/checkout` directly), since the server has no idea what `/checkout` is — only React Router does, once `index.html` loads.

## The seeding logic (the confusing part)

```js
await sequelize.sync();

const productCount = await Product.count();
if (productCount === 0) {
  // ...build arrays with timestamps...
  await Product.bulkCreate(productsWithTimestamps);
  // ...
}
```

Breaking this down:

1. **`sequelize.sync()`** — tells Sequelize to look at your models (`Product`, `Order`, etc.) and create matching tables in the database if they don't exist yet. This runs every time the server starts, but it's safe — it won't destroy existing tables, just create missing ones.

2. **`Product.count()`** — checks how many rows are in the `Products` table *right now*.

3. **`if (productCount === 0)`** — this is the key line. It only inserts the default/starter data **if the table is completely empty.** So the first time you ever run the server (fresh database), it seeds everything. Every time after that, this block is skipped, because `productCount` is no longer `0` — your real data is already there and won't get wiped or duplicated.

4. **The timestamp mapping** (`createdAt`, `updatedAt`) — Sequelize normally generates these automatically, but when you bulk-insert pre-made data (`defaultProducts` from a separate file), Sequelize doesn't always fill them in for you, so the code does it manually, giving each item a unique millisecond (`timestamp + index`) so they don't all have the exact same `createdAt`.

### Why this matters for your Supabase migration

The first time your server connects to a *brand-new* Supabase database, `Product.count()` will be `0`, so this seeding logic fires automatically and populates products, delivery options, cart items, and orders — meaning **you don't need to manually copy data over unless you've created real data beyond these defaults** (e.g. orders you placed while testing locally that you actually want to keep).

## Error handling

```js
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
```

This is a special kind of Express middleware — having 4 parameters (including `err` first) is what tells Express "this catches errors," rather than handling normal requests. If any route handler throws an error (like `routes/orders.js` does with `throw new Error(...)` for a missing product), it ends up here instead of crashing the server, and the client gets a clean `500` response instead of a broken connection.
