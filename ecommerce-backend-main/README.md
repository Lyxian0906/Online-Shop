# Backend documentation

My store backend: **Express** (the web server) + **Sequelize** (talks to the database) + **Supabase** (Postgres database and login).

There is **one document per file**. Each one explains, in simple words:
what the file is for, the code piece by piece, the words I did not know, and how to build something similar.

---

## The files

| File | What it is | Doc |
|---|---|---|
| `server.js` | Starts the server and connects everything | [server](server.md) |
| `models/index.js` | The database connection | [models/index](models/index.md) |
| `models/Product.js` | Table of products | [models/Product](models/Product.md) |
| `models/Order.js` | Table of orders | [models/Order](models/Order.md) |
| `models/CartItem.js` | Table of cart items | [models/CartItem](models/CartItem.md) |
| `models/DeliveryOption.js` | Table of delivery options | [models/DeliveryOption](models/DeliveryOption.md) |
| `models/Profile.js` | Table of users (role) | [models/Profile](models/Profile.md) |
| `models/OrderMessage.js` | Table of chat messages | [models/OrderMessage](models/OrderMessage.md) |
| `middleware/auth.js` | Checks who is logged in, and who is admin | [middleware/auth](middleware/auth.md) |
| (read first) | The ideas every route file uses, explained once in detail | [routes/00-route-basics](routes/00-route-basics.md) |
| `routes/products.js` | Products: list, one, add, edit, delete | [routes/products](routes/products.md) |
| `routes/cartItems.js` | The user's cart | [routes/cartItems](routes/cartItems.md) |
| `routes/orders.js` | Checkout and the user's orders (has the **class**) | [routes/orders](routes/orders.md) |
| `routes/paymentSummary.js` | The totals of the cart | [routes/paymentSummary](routes/paymentSummary.md) |
| `routes/deliveryOptions.js` | The delivery options | [routes/deliveryOptions](routes/deliveryOptions.md) |
| `routes/me.js` | Who am I? | [routes/me](routes/me.md) |
| `routes/adminOrders.js` | Admin: see, edit and delete any order | [routes/adminOrders](routes/adminOrders.md) |
| `routes/orderMessages.js` | The chat of an order | [routes/orderMessages](routes/orderMessages.md) |
| `routes/reset.js` | Old "wipe everything" route (not used anymore) | [routes/reset](routes/reset.md) |

Note: `routes/orders.js` and `middleware/auth.js` were not in the files I uploaded. Their docs describe the versions Claude gave me. If mine changed, compare.

---

## How a request travels (the big picture)

Example: a customer clicks "Add to cart".

```
Browser
  |  POST /api/cart-items   (with the token in the Authorization header)
  v
server.js          -> cors(), express.json() run first (middleware for EVERY request)
  |                -> app.use('/api/cart-items', ...) sends it to the right router
  v
routes/cartItems.js
  |  router.use(requireAuth)  -> middleware/auth.js checks the token, sets req.user
  |  router.post('/', ...)    -> the real work
  v
models/Product.js, models/CartItem.js   (Sequelize turns JS into SQL)
  v
models/index.js  ->  Supabase (Postgres)
  v
Answer goes back:  res.status(201).json(cartItem)
```

Four ideas you will see in every file:
1. **Model** = a table, described in JavaScript.
2. **Route** = "when someone calls this address with this method, run this function".
3. **Middleware** = a function that runs *before* the route and can stop the request.
4. **Status code** = a number that says how it went (200 ok, 201 created, 400 bad request, 401 not logged in, 403 not allowed, 404 not found, 409 conflict).

---

## Best reading order

1. `models/index.js` (the connection)
2. `models/Product.js`, then the other models
3. `server.js` (how it all starts)
4. `middleware/auth.js`
5. Simple routes: `me`, `deliveryOptions`, `paymentSummary`
6. `products`, `cartItems`
7. `orders` (the hardest one), `adminOrders`, `orderMessages`

---

## Recipe: building a backend like this from zero

1. `npm init`, install `express`, `sequelize`, `pg`, `cors`, `dotenv`, `@supabase/supabase-js`. Put `"type": "module"` in `package.json` to use `import`.
2. Create `.env` with the database values and the Supabase URL and key. Add `.env` to `.gitignore`.
3. Write `models/index.js` (the connection).
4. Write one model per table.
5. Write `middleware/auth.js` (login check and admin check).
6. Write one route file per area (products, cart, orders...). Always: validate the input, check who is asking, answer with the right status code.
7. Write `server.js`: middleware, mount the routes, `sequelize.sync()`, `listen`.
8. Test each route (browser for GET, Postman or `fetch` for the rest).

Golden rules I learned:
- **The frontend is never security.** Every protected route checks on the server.
- **Never trust numbers from the browser** (prices, totals). Calculate them on the server.
- **Filter by `req.user.id`** so people only see their own data.
- **Restart the server** after changing code or `.env`.