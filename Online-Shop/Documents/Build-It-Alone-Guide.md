# Build It Alone — A Practical Guide for Making Full-Stack Websites

> Lyx

---

## Table of contents

1. The mindset that stops you from getting stuck
2. The big picture: every web app is the same 4 things
3. GET, POST, PUT, DELETE explained (finally)
4. Ternary `? :`, `&&`, `if/else` explained with real examples
5. How to split the backend into routes (no more confusion)
6. How to split the frontend into components and pages
7. The "copy-paste skeleton": files almost every project has
8. Step-by-step recipe to build any new feature (the 10-step loop)
9. Templates you can copy (backend + frontend)
10. How to plan a brand new website from zero
11. Debugging: what to check when something doesn't work
12. Common mistakes (that you will probably make, and that's normal)
13. Cheat sheets
14. A practice plan to become independent

---

## 1. The mindset that stops you from getting stuck

**Getting stuck is not a sign you are bad. It is the normal state of programming.** Professionals are stuck constantly; they just have a method.

### Rule 1: Make it smaller
You are stuck because the problem is too big. Split it until each piece is *one small question*.

Bad: "I need to make the admin orders page."
Good:
1. Can I show the text "Orders" on the page?
2. Can I fetch the orders and `console.log` them?
3. Can I show one order's id on screen?
4. Can I show all of them in a list?
5. Can I add a delete button that only does `console.log("delete")`?
6. Can that button call the server?

### Rule 2: One thing at a time, and test after each
Never write 100 lines and then run. Write 5 lines, run, see it work, continue.

### Rule 3: Always know which side is broken
Every bug is in one of three places:
```
[ Browser / React ]  --request-->  [ Express route ]  --query-->  [ Database ]
```
Find which arrow fails (section 11 shows how).

### Rule 4: Copy a working piece, then change it
You do not need to invent everything. Your own project already has a working list page, form page, login page and route file. Copy them and change names. This is what experienced developers do.

### Rule 5: Say it in plain words before writing code
Write comments in your own language first:
```js
// 1. get the id from the URL
// 2. ask the server for that product
// 3. if it fails show an error
// 4. if it works save it in state
```
Then turn each comment into code. (You already do this in your comment blocks, keep it.)

### Rule 6: Read the error message from the top
Error messages are not insults, they are directions. Read: *what* failed, *which file*, *which line*.

---

## 2. The big picture: every web app is the same 4 things

```
┌────────────┐     HTTP request      ┌────────────┐    SQL/ORM    ┌────────────┐
│  FRONTEND  │ ────────────────────> │  BACKEND   │ ────────────> │  DATABASE  │
│ (React)    │ <──────────────────── │ (Express)  │ <──────────── │ (Postgres) │
└────────────┘     JSON response     └────────────┘               └────────────┘
   what the user      the rules and         where data
   sees and clicks    security              is stored
```

| Part | Job | In your project |
|---|---|---|
| **Frontend** | Draw screens, collect input, call the API | `AdminPage.jsx`, `LoginPage.jsx`, `ProductsPage.jsx` |
| **Backend** | Validate, check permissions, apply rules, talk to the DB | `products.js`, `orders.js`, `cartItems.js` |
| **Database** | Store data permanently | Sequelize models: Product, Order, CartItem... |
| **Auth** | Know who the user is | Supabase + `AuthContext.jsx` + `requireAuth` |

### The golden rule
**The frontend is for comfort, the backend is for security.** The frontend can be changed by any user in the browser. So every important rule (who can delete, what the price is, is there stock) **must be checked in the backend**, even if the frontend also checks it to be nice.

### Every feature is the same sentence
> "The user does **X** on a page, the page sends a **request** to a **route**, the route uses a **model** to read/write the database, and answers with **JSON**, and the page shows the result."

Examples from your project:

| Feature | Page | Request | Route file | Model |
|---|---|---|---|---|
| Add product | AdminPage | `POST /api/products` | products.js | Product |
| Add to cart | ProductPage | `POST /api/cart-items` | cartItems.js | CartItem |
| See orders | AdminOrdersPage | `GET /api/admin/orders` | adminOrders.js | Order |
| Send message | OrderChat | `POST /orders/:id/messages` | orderMessages.js | OrderMessage |

If you can fill this table for a new feature, you already know what to build.

---

## 3. GET, POST, PUT, DELETE explained (finally)

These are called **HTTP methods**. They are just the *verb* of the request: what do you want to do with the data?

| Method | Meaning | Real-life comparison | Has body? | Success code |
|---|---|---|---|---|
| **GET** | Read / get data | Looking at a menu | No | 200 |
| **POST** | Create something new | Placing a new order | Yes | 201 |
| **PUT** | Change something existing | Changing your order | Yes | 200 |
| **DELETE** | Remove something | Cancelling the order | No | 204 |

(There is also **PATCH** = change only some fields. Your project uses PUT for that. It's fine.)

The **URL** says *what* (products, orders), the **method** says *what to do* with it.

```
GET    /api/products        -> list all products
GET    /api/products/5      -> get product 5
POST   /api/products        -> create a product (data in body)
PUT    /api/products/5      -> change product 5 (data in body)
DELETE /api/products/5      -> delete product 5
```

This pattern is called **REST**. Memorize this table: it works for EVERY thing (users, posts, books, tasks).

### 3.1 Where does the data travel? 3 places

| Place | Looks like | Backend reads it with | When to use |
|---|---|---|---|
| **URL path** | `/products/5` | `req.params.id` | which item |
| **Query string** | `/products?search=shirt` | `req.query.search` | filters, options (`expand`) |
| **Body** | `{ "name": "Socks" }` | `req.body.name` | data to create/change |

Plus **headers** (login token) and **who you are**: `req.user` (set by `requireAuth`).

### 3.2 Frontend code for each method (axios)

```js
// GET: read
const response = await axios.get('/api/products');
setProducts(response.data);              // the JSON is in response.data

// GET with query string
await axios.get('/api/products', { params: { search: 'shirt' } });

// POST: create (2nd argument = body)
await axios.post('/api/products', { name: 'Socks', priceCents: 1000 });

// PUT: change (URL has the id, 2nd argument = body)
await axios.put(`/api/products/${id}`, { stock: 0 });

// DELETE: remove (no body)
await axios.delete(`/api/products/${id}`);
```

Memory trick: **GET and DELETE have no body → 1 argument. POST and PUT carry data → 2 arguments.**

### 3.3 Backend code for each method (Express)

```js
router.get('/', async (req, res) => {              // GET /products
  const products = await Product.findAll();
  res.json(products);
});

router.get('/:id', async (req, res) => {           // GET /products/5
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

router.post('/', async (req, res) => {             // POST /products
  const { name, priceCents } = req.body;
  const product = await Product.create({ name, priceCents });
  res.status(201).json(product);
});

router.put('/:id', async (req, res) => {           // PUT /products/5
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  product.name = req.body.name ?? product.name;
  await product.save();
  res.json(product);
});

router.delete('/:id', async (req, res) => {        // DELETE /products/5
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  await product.destroy();
  res.status(204).send();
});
```

### 3.4 The 4 steps that EVERY backend route follows

Every route you wrote is this:

```
1. READ the input        (req.params / req.query / req.body / req.user)
2. VALIDATE it           (is it the right type? is it allowed? does it exist?)
3. DO the work           (database: find / create / save / destroy)
4. ANSWER                (res.json(...) or res.status(...).json({ error }))
```

When you get lost writing a route, write these four comment lines first and fill each one.

### 3.5 Status codes: just learn these

| Code | Meaning | When |
|---|---|---|
| 200 | OK | normal success |
| 201 | Created | after POST |
| 204 | No content | after DELETE |
| 400 | Bad request | the user sent bad data |
| 401 | Not logged in | no/invalid token |
| 403 | Forbidden | logged in but not allowed (not admin) |
| 404 | Not found | item doesn't exist |
| 409 | Conflict | valid but impossible now (sold out) |
| 500 | Server error | a bug in your code |

### 3.6 The full life of one request (example: "Add to cart")

1. User clicks **Add to Cart** → `addToCart()` runs in `ProductPage`.
2. `axios.post('/api/cart-items', { productId, quantity })`.
3. The server's router (`cartItems.js`) first runs `requireAuth` → sets `req.user`.
4. The `POST /` handler reads `req.body`, validates (product exists? stock? quantity?), creates/updates `CartItem`.
5. Responds `201` + JSON, **or** `409` + `{ error: "Only 3 in stock." }`.
6. Back in React: the `try` continues (success) or the `catch` runs (error) and shows `err.response.data.error`.

### 3.7 try / catch with axios (why and how)

axios **throws** when the status is 400+. So you wrap in `try/catch`:

```js
try {
  await axios.post('/api/cart-items', body);
  // runs only if success
} catch (err) {
  // runs if 4xx/5xx or network error
  setError(err.response?.data?.error || 'Something went wrong');
}
```

- `err.response` = the server's answer (doesn't exist if the server is off).
- `err.response.status` = number (401, 404...).
- `err.response.data` = the JSON the server sent (`{ error: "..." }`).
- `?.` = "if it exists, continue; if not, give undefined instead of crashing".

---

## 4. Ternary `? :`, `&&`, `if/else` explained with real examples

All of these answer the same question: **"what do I do if this is true, and what if it's false?"**

### 4.1 `if / else` (the normal way)

```js
let label;
if (isLogin) {
  label = "Log in";
} else {
  label = "Create account";
}
```

### 4.2 Ternary `condition ? ifTrue : ifFalse`

The same thing in one line:

```js
const label = isLogin ? "Log in" : "Create account";
```

Read it aloud: **"Is `isLogin` true? → then 'Log in', otherwise 'Create account'."**

Structure: `QUESTION ? ANSWER_IF_YES : ANSWER_IF_NO`

It **returns a value**, so you can use it inside JSX, inside a string, or as an argument:

```jsx
<h1>{isLogin ? "Log in" : "Create account"}</h1>
```

### 4.3 Chained ternary (two questions)

From your `LoginPage`:

```jsx
{submitting ? "Please wait..." : isLogin ? "Log in" : "Create account"}
```

Read it as a staircase:
```
if submitting        -> "Please wait..."
else if isLogin      -> "Log in"
else                 -> "Create account"
```

**Tip:** if you need more than two levels, use normal `if` before the `return` instead; it's easier to read.

### 4.4 `&&` — "show this only if..."

```jsx
{error && <p className="login-error">{error}</p>}
```

Meaning: "if `error` has text, show the paragraph; otherwise show nothing."
It works because `A && B` gives `B` when `A` is true and `A` (falsy → nothing drawn) when false.

Use `&&` when there is **no "else"**. Use `? :` when there are **two options**.

⚠️ Careful with numbers: `{count && <p>..</p>}` draws a **0** when count is 0. Use `{count > 0 && ...}`.

### 4.5 `??` and `||` — default values

```js
const name = product.name ?? "No name";     // only if null/undefined
const msg  = err.response?.data?.error || "Something went wrong"; // if empty/falsy too
```

- `??` "if left side is null or undefined, use the right side."
- `||` "if left side is falsy (empty string, 0, null...), use the right side."

### 4.6 Optional chaining `?.`

```js
order.product?.name       // if product is null → undefined, no crash
session?.user?.id
```
Read: "if what's before `?.` exists, go on; if not, stop and give undefined".

### 4.7 Early return (the cleanest if/else in components)

From `ResetPasswordPage`:

```jsx
if (loading) return <p>Checking your link...</p>;
if (!isLoggedIn) return <p>Link not valid</p>;
if (done) return <p>Password updated</p>;
return <form>...</form>;
```

Each `if` handles one case and **leaves**. No nesting, easy to read. Use this whenever a page has several "screens".

### 4.8 Same idea in the backend: guard clauses

```js
if (!product) return res.status(404).json({ error: 'Not found' });
if (product.stock < qty) return res.status(409).json({ error: 'Sold out' });
// if we got here, everything is fine
```

Check the **bad cases first** and `return`. The rest of the function is the "happy path". Your routes already do this.

### 4.9 How to read a confusing line (method)

1. Find the `?`. Everything **before** it is the question.
2. Find the `:`. Between `?` and `:` is the "yes" answer. After `:` is the "no" answer.
3. Rewrite it as an `if/else` on paper.

Example: `const soldOut = product ? product.stock <= 0 : false;`
→ "Is there a product? Then soldOut = (stock is 0 or less). If there is no product yet, soldOut = false."

### 4.10 Quick table

| I want... | Use |
|---|---|
| Two different values/elements | `cond ? a : b` |
| Something or nothing | `cond && <X />` |
| Default if missing | `value ?? default` |
| Safe access to nested data | `obj?.a?.b` |
| Several screens | early `return`s |
| Stop a function on bad input | guard clause `if (bad) return ...` |

---

## 5. How to split the backend into routes (no more confusion)

### 5.1 The idea: one file per "thing" (resource)

Your backend already follows the rule: **one router file per noun**.

```
routes/
  products.js        -> /products
  cartItems.js       -> /cart-items
  deliveryOptions.js -> /delivery-options
  paymentSummary.js  -> /payment-summary
  orders.js          -> /orders
  orderMessages.js   -> /orders/:orderId/messages
  adminOrders.js     -> /admin/orders
  me.js              -> /me
  reset.js           -> /reset
```

**How to decide where a new endpoint goes:**
1. What is the **noun**? (product, order, user, book) → that file.
2. Is it only for admins? → admin file or add `requireAdmin` to the route.
3. Does it belong *inside* another noun (messages of an order)? → nested route.
4. Is it a special calculation (payment summary)? → its own small file.

### 5.2 How the main server connects them

```js
// server.js (or app.js)
import express from 'express';
import cors from 'cors';
import productsRouter from './routes/products.js';
import cartItemsRouter from './routes/cartItems.js';
// ...

const app = express();
app.use(cors());
app.use(express.json());           // IMPORTANT: lets you read req.body

app.use('/api/products', productsRouter);
app.use('/api/cart-items', cartItemsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/orders/:orderId/messages', orderMessagesRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/me', meRouter);

// error handler LAST
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(3000, () => console.log('Server on 3000'));
```

`app.use('/api/products', productsRouter)` + `router.get('/')` inside = `GET /api/products`.
`router.get('/:id')` inside = `GET /api/products/5`.

### 5.3 Folder structure of a good backend

```
backend/
  server.js               <- creates the app and mounts routers
  package.json            <- "type": "module"
  .env                    <- secrets (DB url, keys). NEVER upload to GitHub
  models/
    index.js              <- sequelize connection
    Product.js ...        <- one file per table
  routes/                 <- what URLs exist
  middleware/
    auth.js               <- requireAuth, requireAdmin
  defaultData/            <- sample data for reset/seed
```

### 5.4 What goes where

| Layer | Contains | Never contains |
|---|---|---|
| **routes** | read input, validate, call models, answer | big business formulas repeated in several files |
| **models** | table definitions | HTTP stuff (`req`, `res`) |
| **middleware** | checks that run before routes (login, admin) | page-specific logic |
| **utils / services** (optional) | reusable functions (`calculateTotals`) | `req`/`res` |

When a formula is needed in two routes (like tax in `orders.js` and `paymentSummary.js`), move it to `utils/pricing.js` and import it in both.

### 5.5 Middleware: the "doors" concept

Think of a route as a room and middleware as doors in front of it:

```
request -> [requireAuth door] -> [requireAdmin door] -> [route handler]
```

```js
router.use(requireAuth);                       // all routes in this file need login
router.post('/', requireAuth, requireAdmin, handler);   // only this route
```

### 5.6 Route order matters

Express tests routes **top to bottom**. Put specific ones before generic ones:

```js
router.get('/search', ...);   // first
router.get('/:id', ...);      // else "search" would be treated as an id
```

### 5.7 Checklist before writing any new route

- [ ] Method + URL decided (use the REST table)
- [ ] Who may use it? (public / logged in / owner / admin)
- [ ] What input does it need and where does it come from (params/query/body)?
- [ ] Which errors can happen and which status each gets?
- [ ] What does it return?

---

## 6. How to split the frontend into components and pages

### 6.1 Page vs component

| | Page | Component |
|---|---|---|
| What | A whole screen with a URL | A reusable piece used inside pages |
| Example | `AdminPage`, `LoginPage`, `ProductPage` | `AdminNav`, `Header`, `Loading`, `OrderChat` |
| Usually has | data loading, several states | few props, little or no loading |
| Router | has a `<Route>` | no `<Route>` |

### 6.2 When should I make a component?

Make a new component when **any** of these is true:

1. **I copy-pasted the same JSX twice** (e.g. the nav in two admin pages → `AdminNav`).
2. **A piece has its own state** that doesn't matter to the rest (each `OrderCard` has its own edit values).
3. **The file is too long to read** (> ~200 lines) and has clear parts.
4. **I can give it a clear name** ("this is the order chat").

Do **not** split too early. Build everything in one file first; split when it hurts.

### 6.3 Props: how components talk

Parent → child with props; child → parent with **function props** (callbacks).

```jsx
// Parent
<OrderCard order={order} onChanged={loadOrders} />

// Child
function OrderCard({ order, onChanged }) {
  // reads order (data going down)
  // calls onChanged() to tell the parent "reload!" (event going up)
}
```

Rule: **data flows down, events flow up.**

### 6.4 Where should state live? ("lifting state up")

Ask: *who needs this value?*

- Only one component → keep `useState` inside it.
- Two sibling components → move the state to their common parent and pass it down.
- The whole app (user, theme, cart count) → Context (`AuthContext`) or a top-level component (`cart` + `loadCart` in App).

Your project: `cart` and `loadCart` live in the top, `ProductPage` receives them; `AuthContext` shares the user everywhere.

### 6.5 Suggested frontend folder structure

```
src/
  main.jsx                 <- renders <App /> inside providers
  App.jsx                  <- routes (which URL shows which page)
  context/
    AuthContext.jsx        <- shared login state
  lib/
    supabase.js            <- supabase client
  utils/
    money.js               <- formatMoney, helpers
  components/              <- reusable pieces
    Header.jsx
    Loading.jsx
    OrderChat.jsx
  pages/
    home/HomePage.jsx
    product/ProductPage.jsx + ProductPage.css
    login/LoginPage.jsx + LoginPage.css
    admin/AdminPage.jsx, AdminNav.jsx, AdminOrdersPage.jsx + css
```

Rule: a file and its CSS live side by side.

### 6.6 The anatomy of ANY page (copy this thinking)

Every page in your project follows the same order inside the function:

```jsx
export function SomePage() {
  // 1. HOOKS: router (useParams, useNavigate), context (useAuth)
  // 2. STATE: useState for data, form, error, loading
  // 3. LOADING DATA: useEffect + axios.get
  // 4. FUNCTIONS: handlers for buttons/forms (async, try/catch)
  // 5. DERIVED VALUES: filter(), calculations (not state!)
  // 6. EARLY RETURNS: loading / error screens (optional)
  // 7. RETURN JSX: what is drawn
}
```

Put things in this order every time and you'll never wonder "where does this go?".

### 6.7 State: what to store and what not to

- **State** = data that changes and must redraw the screen (inputs, lists from the server, flags).
- **Not state** = anything you can compute from other state (`visibleProducts = products.filter(...)`, `soldOut = stock <= 0`).

### 6.8 The 4 flags you need for any async action

```js
const [data, setData] = useState([]);       // the result
const [loading, setLoading] = useState(true);  // waiting for the first load
const [error, setError] = useState('');       // what went wrong
const [saving, setSaving] = useState(false);  // waiting for a button action
```

Every page in your project uses this pattern. Use it by default.

### 6.9 Forms: the pattern

```jsx
const [form, setForm] = useState({ name: '', price: '' });

const updateField = (e) => setForm({ ...form, [e.target.name]: e.target.value });

<input name="name" value={form.name} onChange={updateField} />
<input name="price" value={form.price} onChange={updateField} />
```

One `form` object + one `updateField` function = any number of fields. Convert types (string → number, dollars → cents) **when sending**, not while typing.

### 6.10 Lists: the pattern

```jsx
<ul>
  {items.map((item) => (
    <li key={item.id}>{item.name}</li>
  ))}
</ul>
```

- `.map` turns data into elements.
- `key` must be unique and stable (use the id, not the index if items can be removed).
- `.filter` before `.map` for search.

---

## 7. The "copy-paste skeleton": files almost every project has

Almost every full-stack website (store, blog, task manager, library, social app) is built from the **same files**. Change the nouns and a few fields and you have a new project.

### 7.1 Backend skeleton (same in every project)

| File | Purpose | What you change per project |
|---|---|---|
| `server.js` | creates app, `express.json()`, mounts routers, error handler | router names |
| `models/index.js` | DB connection | DB URL (from `.env`) |
| `models/<Thing>.js` | one table | the fields |
| `middleware/auth.js` | `requireAuth`, `requireAdmin` | almost nothing |
| `routes/<things>.js` | CRUD for one thing | the model + validation |
| `routes/me.js` | current user | nothing |
| `defaultData/*.js` + `routes/reset.js` | sample data | the data |
| `.env` | secrets | your values |

### 7.2 Frontend skeleton (same in every project)

| File | Purpose | What you change |
|---|---|---|
| `main.jsx` | renders App with providers (`BrowserRouter`, `AuthProvider`) | nothing |
| `App.jsx` | the list of routes | routes |
| `context/AuthContext.jsx` | login state | nothing (or the auth provider) |
| `lib/supabase.js` | auth client | keys |
| `pages/login/LoginPage.jsx` | log in / register | text and styles |
| `pages/login/ForgotPasswordPage.jsx` + `ResetPasswordPage.jsx` | reset password | nothing |
| `components/Header.jsx` | top bar | links |
| `components/Loading.jsx` | spinner | nothing |
| `pages/admin/AdminNav.jsx` | admin tabs | links |
| `pages/admin/AdminPage.jsx` | CRUD list + form for the main thing | fields |
| `pages/<thing>/<Thing>Page.jsx` | detail page | fields |
| `utils/*.js` | helpers (money, dates) | as needed |

**Your auth pages (Login, Forgot, Reset, AuthContext, `me.js`, `requireAuth`) can be copied unchanged into every new project.** That alone saves days.

### 7.3 "Same project, different clothes" examples

| Project | "Product" becomes | "Order" becomes | "Cart" becomes |
|---|---|---|---|
| Online store | Product | Order | CartItem |
| **Library manager** | Book | Loan | Reading list |
| Recipe site | Recipe | Meal plan | Shopping list |
| Course platform | Course | Enrollment | Wishlist |
| Booking app | Room / Service | Booking | Pending bookings |
| Blog | Post | — | Bookmarks |
| Task manager | Task | — | — |

For your **Library Manager / book recommendation site**: copy `products.js` → `books.js` (fields: title, author, cover, genre, rating, description), copy `AdminPage.jsx` → `AdminBooksPage.jsx`, copy `ProductPage.jsx` → `BookPage.jsx`, copy the auth files as they are. Then add what's new (recommendations).

### 7.4 The "CRUD vertical slice" — build features in this order

For each new "thing" (e.g. Book), build a **vertical slice** from bottom to top:

1. Model (`Book.js`) and sample data
2. Route file (`books.js`) with GET list, GET one, POST, PUT, DELETE
3. Test the routes with Thunder Client / Postman / the browser (before any React)
4. Public list page + detail page (reading data)
5. Admin page (create, edit, delete)
6. Polish: loading states, errors, empty states

Building one full slice at a time is easier than "all the backend, then all the frontend".

---

## 8. Step-by-step recipe to build any new feature (the 10-step loop)

Use this every time. Example feature: **"Customers can write a review on a product."**

1. **Say it in one sentence.** "A logged-in user can post a review (stars + text) on a product, and everyone can read the reviews."
2. **List the data.** Review: `id`, `productId`, `userId`, `stars (1–5)`, `text`, `createdAt`.
3. **List the endpoints** with the REST table:
   - `GET  /api/products/:productId/reviews` (public)
   - `POST /api/products/:productId/reviews` (logged in)
   - `DELETE /api/reviews/:id` (owner or admin)
4. **Write the model** (copy `OrderMessage.js`, rename, change fields).
5. **Write the route** (copy `orderMessages.js`, change the checks). Use the 4 steps: read → validate → do → answer.
6. **Mount it** in `server.js`.
7. **Test it without React** (Thunder Client). Try the happy path and every error.
8. **Write the frontend** — start with `GET` and `console.log`; then render; then the form (`POST`); then delete.
9. **Handle the 4 flags** (`loading`, `error`, `saving`, empty list message).
10. **Test the rules as different users** (guest, customer, other customer, admin).

### The "copy the closest existing thing" trick

Before writing from scratch, ask: **"which file I already wrote is most similar?"**

| New thing | Closest existing file |
|---|---|
| A chat/comments/reviews list | `orderMessages.js` + `OrderChat` |
| A CRUD for a new noun | `products.js` + `AdminPage.jsx` |
| A "my things" page for the user | `orders.js` (GET with `userId`) |
| An admin overview with joins | `adminOrders.js` |
| A calculated summary | `paymentSummary.js` |
| A detail page | `ProductPage.jsx` |
| Any form with error handling | `LoginPage.jsx` |

---

## 9. Templates you can copy

Replace `Thing` / `things` with your noun (Book / books).

### 9.1 Backend: model (Sequelize)

```js
// models/Thing.js
import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

export const Thing = sequelize.define('Thing', {
  id:    { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:  { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  priceCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  keywords: { type: DataTypes.JSON, defaultValue: [] }
});
```

(Your real model files may use a slightly different style; keep the style you already have.)

### 9.2 Backend: complete CRUD route

```js
// routes/things.js
import express from 'express';
import { Thing } from '../models/Thing.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// READ list (public)
router.get('/', async (req, res, next) => {
  try {
    const things = await Thing.findAll();
    res.json(things);
  } catch (err) { next(err); }
});

// READ one (public)
router.get('/:id', async (req, res, next) => {
  try {
    const thing = await Thing.findByPk(req.params.id);
    if (!thing) return res.status(404).json({ error: 'Thing not found' });
    res.json(thing);
  } catch (err) { next(err); }
});

// CREATE (admin)
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, priceCents } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!Number.isInteger(priceCents) || priceCents < 0) {
      return res.status(400).json({ error: 'priceCents must be a whole number, 0 or more' });
    }

    const thing = await Thing.create({ name: name.trim(), description, priceCents });
    res.status(201).json(thing);
  } catch (err) { next(err); }
});

// UPDATE (admin): only change what was sent
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const thing = await Thing.findByPk(req.params.id);
    if (!thing) return res.status(404).json({ error: 'Thing not found' });

    const { name, description, priceCents } = req.body;
    if (name !== undefined) thing.name = name;
    if (description !== undefined) thing.description = description;
    if (priceCents !== undefined) thing.priceCents = priceCents;

    await thing.save();
    res.json(thing);
  } catch (err) { next(err); }
});

// DELETE (admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const thing = await Thing.findByPk(req.params.id);
    if (!thing) return res.status(404).json({ error: 'Thing not found' });
    await thing.destroy();
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
```

Why `try/catch` + `next(err)`? On Express 4, an error inside an `async` function that isn't caught can leave the request hanging. This pattern sends it to your global error handler.

### 9.3 Backend: "only the owner" route (copy from orders)

```js
router.use(requireAuth);

router.get('/', async (req, res) => {
  const mine = await Thing.findAll({ where: { userId: req.user.id } });  // <- only mine
  res.json(mine);
});

router.get('/:id', async (req, res) => {
  const thing = await Thing.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!thing) return res.status(404).json({ error: 'Not found' });   // same answer for "not yours"
  res.json(thing);
});
```

### 9.4 Frontend: list page that loads data

```jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export function ThingsPage() {
  const [things, setThings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get('/api/things');
        setThings(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load.');
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (things.length === 0) return <p>Nothing here yet.</p>;

  return (
    <ul>
      {things.map((thing) => (
        <li key={thing.id}>{thing.name}</li>
      ))}
    </ul>
  );
}
```

### 9.5 Frontend: detail page with the id from the URL

```jsx
import { useParams } from 'react-router';

export function ThingPage() {
  const { thingId } = useParams();           // from route "/thing/:thingId"
  const [thing, setThing] = useState(null);

  useEffect(() => {
    axios.get(`/api/things/${thingId}`).then((res) => setThing(res.data));
  }, [thingId]);                              // reload if the id changes

  if (!thing) return <p>Loading...</p>;
  return <h1>{thing.name}</h1>;
}
```

### 9.6 Frontend: add/edit form (copy of AdminPage, minimal)

```jsx
const emptyForm = { name: '', price: '' };

const [form, setForm] = useState(emptyForm);
const [editingId, setEditingId] = useState(null);   // null = adding, id = editing
const [error, setError] = useState('');
const [saving, setSaving] = useState(false);

const handleSubmit = async (event) => {
  event.preventDefault();
  setError('');

  const priceCents = Math.round(Number(form.price) * 100);
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    setError('Enter a valid price');
    return;
  }

  setSaving(true);
  try {
    const body = { name: form.name, priceCents };
    if (editingId) await axios.put(`/api/things/${editingId}`, body);
    else await axios.post('/api/things', body);

    setForm(emptyForm);
    setEditingId(null);
    await loadThings();         // refresh the list
  } catch (err) {
    setError(err.response?.data?.error || 'Something went wrong.');
  }
  setSaving(false);
};
```

### 9.7 Frontend: a button that deletes

```jsx
const deleteThing = async (thing) => {
  if (!window.confirm(`Delete "${thing.name}"?`)) return;
  try {
    await axios.delete(`/api/things/${thing.id}`);
    await loadThings();
  } catch (err) {
    setError(err.response?.data?.error || 'Could not delete.');
  }
};

<button onClick={() => deleteThing(thing)}>Delete</button>
```

**Why `onClick={() => deleteThing(thing)}` and not `onClick={deleteThing(thing)}`?** Without the arrow function the code would run **immediately while drawing**. The arrow wraps it so it only runs on click.

### 9.8 Frontend: protect an admin page

```jsx
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

// In App.jsx
<Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
```

(Remember: the server still checks `requireAdmin`; this only hides the page.)

### 9.9 Frontend: vite proxy so `/api` reaches your backend

In development the React app (port 5173) and server (port 3000) are different. Add to `vite.config.js`:

```js
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } }
});
```

Then `axios.get('/api/products')` works without CORS problems.

---

## 10. How to plan a brand new website from zero

Do this on paper or in a text file **before** coding. 30 minutes of planning saves days.

### Step 1 — One-paragraph description
"A website where [who] can [do what], and [admin/owner] can [manage what]."

### Step 2 — Nouns (these become tables)
List every "thing": User, Book, Review, Loan... Then for each, its fields and types.

### Step 3 — Relationships
Who owns what? One-to-many arrows:
```
User 1 ---- * Review * ---- 1 Book
```
This tells you where `userId`, `bookId` foreign keys go.

### Step 4 — Roles and permissions table

| Action | Guest | Customer | Admin |
|---|---|---|---|
| See books | ✅ | ✅ | ✅ |
| Write review | ❌ | ✅ | ✅ |
| Delete any review | ❌ | ❌ | ✅ |
| Add/edit books | ❌ | ❌ | ✅ |

This table becomes your `requireAuth` / `requireAdmin` / ownership checks.

### Step 5 — Pages (frontend) and endpoints (backend)

| Page / URL | Shows | Calls |
|---|---|---|
| `/` | list of books | `GET /api/books` |
| `/book/:id` | one book + reviews | `GET /api/books/:id`, `GET .../reviews` |
| `/login` | form | Supabase |
| `/admin` | manage books | CRUD `/api/books` |

### Step 6 — Build order
1. Project setup (server + react + DB connection)
2. Auth (copy from this project)
3. First noun, full vertical slice
4. Second noun
5. Relationships between them
6. Admin tools
7. Polish (loading, errors, empty states, mobile)
8. Deploy

### Step 7 — MVP first
Decide the **smallest version that works** and finish it. Put extras (recommendations, ratings, dark mode) in a "later" list. Unfinished big projects are the #1 reason people quit.

---

## 11. Debugging: what to check when something doesn't work

### 11.1 The 3-place method

```
Browser (Network tab) -> Server terminal -> Database
```

**A. Browser DevTools → Network tab (F12)**
- Did the request happen? Click it.
- Check **URL** (typo? missing `/api`?), **method** (GET vs POST), **status**.
- **Payload/Request body**: is the data what you expected?
- **Response**: the server's `{ error: "..." }` is here.

| What you see | Meaning |
|---|---|
| No request at all | the button handler isn't running (or code stopped before axios) |
| 404 | wrong URL or router not mounted |
| 401 | no token / not logged in |
| 403 | logged in but not admin |
| 400 | validation failed: read the message |
| 500 | bug in the backend: look at the server terminal |
| (failed) / CORS error | server is off, wrong port, or missing proxy/cors |

**B. Server terminal**
- Add `console.log(req.body)`, `console.log(req.params)`, `console.log(req.user)` at the top of the route.
- Errors print here with the file and line.

**C. Console tab in the browser**
- `console.log(response.data)` right after the request.
- React errors appear in red here.

### 11.2 Common symptoms → likely cause

| Symptom | Likely cause |
|---|---|
| `req.body` is `undefined` | missing `app.use(express.json())` or wrong Content-Type |
| `Cannot read properties of undefined (reading 'x')` | data not loaded yet; use `?.` or an early return `if (!product) return ...` |
| Page re-renders forever | `setState` inside render, or `useEffect` without a dependency array |
| Input won't let me type | `value` set without `onChange` |
| List doesn't update after saving | forgot to reload (`await loadProducts()`) or didn't create a new array in state |
| "Each child should have a unique key" | add `key={item.id}` in `.map` |
| Works once, fails after refresh | state lost on refresh; load it again in `useEffect` |
| Button runs on page load | `onClick={fn()}` instead of `onClick={() => fn()}` |
| `await` error | the function isn't `async` |
| 404 on `/api/...` in production | proxy only works in dev; configure the real URL |
| Everything is `[object Object]` | you're printing an object; use `JSON.stringify(obj)` or `.name` |
| Number comes as text | input values are strings; use `Number(...)` |
| Date off by one day | time zones; use noon like `dateInputToMs` |

### 11.3 Tools worth installing
- **Thunder Client** (VS Code) or Postman: test routes without React.
- **React Developer Tools** (browser extension): see state and props.
- **Database viewer** (Supabase dashboard / DBeaver): see the real rows.

### 11.4 Ask for help well
When you ask someone (or an AI), include:
1. What you wanted to happen.
2. What happened instead.
3. The exact error text.
4. The small piece of code involved (not the whole project).
5. What you already tried.

---

## 12. Common mistakes (that you will probably make, and that's normal)

1. **Forgetting `await`** → you get a Promise instead of data.
2. **Forgetting `async`** on the function that uses `await`.
3. **Changing state directly** (`products.push(x)`) instead of `setProducts([...products, x])`.
4. **Not creating a new object/array when updating state** → React doesn't redraw.
5. **Sending prices as dollars** when the server expects cents.
6. **Trusting the frontend** for security.
7. **Trusting `req.body.userId`.** Always use `req.user.id`.
8. **Not returning after `res.status(...).json(...)`**, so the code continues and tries to answer twice ("Cannot set headers after they are sent"). Write `return res...`.
9. **Route order** (`/:id` before `/search`).
10. **Not handling "loading", "error" and "empty"** → blank screens that look broken.
11. **Giant components.** Split when it hurts.
12. **Committing `.env`** with secret keys to GitHub. Add it to `.gitignore`.
13. **Changing 10 things before testing.**
14. **Copying code you don't understand.** Copy, then explain each line in a comment (as you already do). That's how it sticks.

---

## 13. Cheat sheets

### 13.1 Request recipe

| I want to... | Frontend | Backend |
|---|---|---|
| Load a list | `axios.get('/api/x')` | `router.get('/')` + `findAll` |
| Load one | `axios.get(\`/api/x/${id}\`)` | `router.get('/:id')` + `findByPk` |
| Create | `axios.post('/api/x', body)` | `router.post('/')` + `create` |
| Update | `axios.put(\`/api/x/${id}\`, body)` | `router.put('/:id')` + `save` |
| Delete | `axios.delete(\`/api/x/${id}\`)` | `router.delete('/:id')` + `destroy` |
| Filter | `axios.get('/api/x', { params: { search } })` | `req.query.search` |

### 13.2 Sequelize quick reference

```js
await Model.findAll()                                  // all rows
await Model.findAll({ where: { userId: 1 } })          // filter
await Model.findAll({ order: [['createdAt', 'DESC']] })// sort
await Model.findByPk(id)                               // by primary key
await Model.findOne({ where: { a: 1, b: 2 } })         // first match
await Model.create({ ... })                            // insert
row.field = value; await row.save()                    // update
await row.destroy()                                    // delete one
await Model.destroy({ where: { ... } })                // delete many
```

### 13.3 React quick reference

```jsx
const [x, setX] = useState(initial);       // remember a value
useEffect(() => { ... }, []);               // run once on open
useEffect(() => { ... }, [id]);             // run when id changes
const { id } = useParams();                 // URL parameter
const navigate = useNavigate(); navigate('/login');   // go to page
{cond && <A />}                             // show or nothing
{cond ? <A /> : <B />}                      // one or the other
{list.map(i => <Item key={i.id} {...i} />)} // list
onClick={() => doSomething(id)}             // handler with arguments
onChange={(e) => setX(e.target.value)}      // controlled input
```

### 13.4 Validation snippets

```js
typeof x === 'string' && x.trim()          // non-empty text
Number.isInteger(n) && n >= 0              // whole number, 0 or more
Number.isFinite(n)                         // is a real number
Array.isArray(a)                           // is an array
```

### 13.5 Naming conventions (keeps you consistent)

| Thing | Style | Example |
|---|---|---|
| Components / pages | PascalCase | `AdminOrdersPage.jsx` |
| Functions / variables | camelCase | `loadProducts`, `editingId` |
| Boolean variables | start with is/has/can | `isLoggedIn`, `soldOut` |
| Handlers | `handleX` / verb | `handleSubmit`, `deleteProduct` |
| Route files | plural noun | `products.js` |
| CSS classes | kebab-case | `admin-list-header` |
| Constants | UPPER_SNAKE | `MAX_STOCK` |

---

## 14. A practice plan to become independent

The way to stop getting stuck is **repetition with small variations**. Try this order:

### Level 1: Rebuild without looking (1–2 days each)
1. A `Notes` app: `GET/POST/DELETE /api/notes` + a React page with a list, a form and delete buttons. No auth.
2. Add **edit** (PUT) to it.
3. Add **search** with a query string.

### Level 2: Add rules
4. Add auth: only logged-in users, each sees **only their own notes** (copy the `userId` pattern).
5. Add an admin who can see all notes.
6. Add validation and good error messages everywhere.

### Level 3: Relationships
7. Add `Category` with notes belonging to categories (one-to-many).
8. Add comments on notes (copy `orderMessages.js`).

### Level 4: Real project
9. Your **Library Manager**: Books (CRUD), Users, reading list, reviews, recommendations.
10. Deploy it.

### Habits that make you faster
- After you finish a feature, **write 5 lines** in your own words: what it does, which files, which endpoints. (Like the comment blocks you already write.)
- Keep a file called `MY-SNIPPETS.md` with the patterns *you* forget (e.g. the ternary, `useEffect`, `try/catch`).
- Re-read your own old files; you'll see you already solved most things.
- When stuck for 20+ minutes: take a break, reduce the problem, add `console.log`s, then ask for help with a clear question.

---

## One-page summary (print this)

1. Every feature = **page → request → route → model → database → response → page**.
2. **GET read · POST create · PUT change · DELETE remove.** URL = what, method = action.
3. Every route = **read input → validate → do the work → answer.**
4. Every page = **hooks → state → load data → functions → derived values → early returns → JSX.**
5. `cond ? a : b` = two options. `cond && x` = x or nothing. `a ?? b` = default.
6. One router file per noun; one component file per reusable piece.
7. Security lives in the **backend**. Money in **cents**. Never trust the client.
8. Copy the closest working file, rename, change the fields, test small.
9. Debug in order: **Network tab → server terminal → database.**
10. Finish a small version first.
