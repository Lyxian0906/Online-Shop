# `server.js` — where everything starts

## What this file is for
It is the **main file**. When I run the backend, this is what runs. It:
1. creates the Express app,
2. adds the middleware (things that run on every request),
3. connects every route file to an address,
4. serves the built frontend,
5. creates or updates the database tables,
6. starts listening for requests.

**The order of the lines matters.** Express reads top to bottom.

## The code, piece by piece

### 1. Imports
```js
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
```
- `express`: the web server library.
- `import 'dotenv/config'`: **no name**. It only runs a side effect: it reads the `.env` file and puts the values into `process.env`. It must come **before** any file that reads `process.env` while loading (like `models/index.js` and `middleware/auth.js`). Imports run in order, so keep it near the top.
- `cors`: lets the browser (on port 5173) call this server (on port 3000). Without it, the browser blocks the calls.

```js
import { Profile } from './models/Profile.js';
import { OrderMessage } from './models/OrderMessage.js';
```
I never use these names in this file. They are imported **only so the model files run** and register their tables before `sequelize.sync(...)`. If a model is never imported, its table is never created.

The other imports bring in the route files, the other models, the seed data, and `fs` (file system).

### 2. Creating the app
```js
const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```
- `app` is the server.
- `PORT`: the port from `.env`, or 3000 if there isn't one.
- The last two lines rebuild `__dirname` (the folder of this file). In modern `import` files it doesn't exist by itself, so this is the standard trick. It is used to find the `images` and `dist` folders.

### 3. Middleware (runs on every request)
```js
app.use(cors());
app.use(express.json());
```
- `cors()`: adds the headers that allow the browser to call us.
- `express.json()`: reads the body of a request (the `{ "quantity": 2 }` the browser sends) and puts it in `req.body`. Without it, `req.body` is empty.

### 4. Static images
```js
app.use('/images', express.static(path.join(__dirname, 'images')));
```
`static` means "send the files from this folder as they are". So `/images/products/x.jpg` returns that file from the `images` folder.

### 5. Mounting the routes
```js
app.use('/api/products', productRoutes);
app.use('/api/delivery-options', deliveryOptionRoutes);
app.use('/api/cart-items', cartItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment-summary', paymentSummaryRoutes);
app.use('/api/me', meRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/orders/:orderId/messages', orderMessageRoutes);
```
`app.use('/address', router)` means: "everything that starts with this address goes to this router". Inside the router, the address is cut: `router.get('/')` inside `products.js` really means `GET /api/products`.

`/api/orders/:orderId/messages` has a **`:orderId`**: a part that changes. The router reads it with `req.params.orderId` (it needs `mergeParams: true`).

**About the order:** I was told to mount the messages route *above* `/api/orders`. Here it is below, and it still works, because `/api/orders` only has `/` and `/:orderId` (one piece), so `/abc/messages` doesn't match there and Express keeps going to the next line. Putting the more specific one first is just the safer habit.

`reset.js` is **not mounted** anymore (good: that route wiped the database).

### 6. The built frontend
```js
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => { ...send dist/index.html... });
```
`dist` is the frontend after `npm run build`. The `app.get('*')` catches **every other address** and sends `index.html`, so a page like `/orders` works when you refresh (React Router then decides what to show). It is after the `/api` routes on purpose, or it would swallow them.

### 7. The error handler
```js
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
```
Express knows this is an **error handler** because it has **4** parameters. Any route that calls `next(err)` (or throws, in Express 5) ends up here. It prints the real error in the terminal and tells the browser only a generic message. The `eslint-disable` comments just silence the "unused variable" warning for `next`.

### 8. Creating the tables
```js
await sequelize.sync({ alter: true });
```
Looks at every model and makes the database match: creates missing tables, adds missing columns. `alter: true` keeps the data. (`force: true` would **delete everything**.) `await` outside a function works because the file is a module ("top-level await").

### 9. Seeding
```js
const productCount = await Product.count();
if (productCount === 0) { ...bulkCreate the default data... }
```
Only when the products table is **empty**, it inserts the default data from `defaultData/`. On my real database it does nothing.

### 10. Listening
```js
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
```
Starts the server. This line is the last on purpose: the tables are ready before the first request.

## Words I saw
- **Middleware**: a function that runs between the request and the route.
- **Mount**: attach a router to an address.
- **Static files**: files sent as they are.
- **Side-effect import**: `import 'x'` (no name), only to run the file.
- **Top-level await**: using `await` at the top of a module.

## Careful
- Change the code or `.env` -> **restart**.
- If you add a model file, import it here so the table is created.
- Never put the `/api/reset`-style route back once real users exist.

## Build something similar
1. `const app = express()`, `app.use(cors())`, `app.use(express.json())`.
2. One `app.use('/api/thing', thingRoutes)` per route file.
3. The error handler last.
4. `await sequelize.sync(...)` and then `app.listen(PORT)`.
