# AdminPage.jsx — Manage products (list + add + edit + delete)

---

## 1. One-sentence summary

The admin screen for the catalog: a form on top to **add or edit** a product and a list below to **filter, mark sold out, edit or delete** products. It talks to the backend `products.js` routes.

## 2. What the user sees

```
Manage products
[Products | Orders]                <- AdminNav

Add a product   (or "Edit product")
Name  Image path  Price  Stock  Keywords  Description
(error)
[Add product] [Cancel]

Products (12)              [Filter by name]
[img] Name  $19.99 · Stock: 5   [Mark sold out] [Edit] [Delete]
...
```

## 3. Backend calls it makes

| Action | Request | Backend file |
|---|---|---|
| Load list | `GET /api/products` | `products.js` |
| Add | `POST /api/products` | admin only |
| Save edit | `PUT /api/products/:id` | admin only |
| Mark sold out | `PUT /api/products/:id` with `{ stock: 0 }` | admin only |
| Delete | `DELETE /api/products/:id` | admin only |

## 4. State (what the page remembers)

```js
const [products, setProducts] = useState([]);   // list from the database
const [form, setForm] = useState(emptyForm);     // what's typed in the boxes
const [editingId, setEditingId] = useState(null);
const [filter, setFilter] = useState("");
const [error, setError] = useState("");
const [saving, setSaving] = useState(false);
```

| State | Meaning |
|---|---|
| `products` | all products received from the server |
| `form` | an object with the 6 text fields (all strings) |
| `editingId` | **`null` = adding a new product**, **an id = editing that product** (one form, two modes) |
| `filter` | text in the "Filter by name" box |
| `error` | message to show in red |
| `saving` | disables the save button while a request runs |

`emptyForm` (top of the file) is the blank form: `{ name:"", image:"", price:"", stock:"", keywords:"", description:"" }`. Everything is a string because that's what inputs give.

## 5. Functions, one by one

### `loadProducts`
```js
const response = await axios.get("/api/products");
setProducts(response.data);
```
Fetches the list. Called once at start (`useEffect(..., [])`) and again after every change so the screen matches the database.

### `showError(err)`
```js
setError(err.response?.data?.error || "Something went wrong. Try again.");
```
The backend always answers errors as `{ error: "message" }`, so we show that message; if there is none (network down) we show a generic one. `?.` avoids crashes when `response` doesn't exist.

### `updateField(event)`
```js
setForm({ ...form, [event.target.name]: event.target.value });
```
One function for all inputs. Each input has a `name` equal to a key in `form`. `[event.target.name]` is a *computed key*. `...form` copies the other fields so only one changes.

### `handleSubmit(event)` — add or save

Step by step:

1. `preventDefault()` — no page reload; clear the error.
2. **Convert price to cents:** `Math.round(Number(form.price) * 100)`. The user types `19.99`, the server wants `1999`. `Math.round` fixes floating errors (e.g. `19.99*100 = 1998.9999`). If not finite or negative → show "Enter a valid price, like 19.99".
3. **Validate stock:** must not be empty, must be an integer ≥ 0.
4. Build the body:
   ```js
   { name, image, priceCents, stock, keywords: form.keywords, description }
   ```
   `keywords` is sent as the raw string `"a, b, c"`; the server's `cleanKeywords` accepts that.
5. `setSaving(true)` then:
   - `editingId` set → `PUT /api/products/${editingId}`
   - otherwise → `POST /api/products`
6. On success: clear the form, `editingId = null`, reload the list. On failure: `showError`.
7. `setSaving(false)`.

### `startEdit(product)`
Clicked on **Edit**: sets `editingId`, fills the form with the product's values and scrolls to the top (`window.scrollTo`).
- Price: `(product.priceCents / 100).toFixed(2)` → cents back to `"19.99"`.
- Stock: `String(product.stock ?? 0)`.
- Keywords: `product.keywords.join(", ")` → array to a string.
- Description: `product.description ?? ""`.

### `cancelEdit`
Resets the form, `editingId` and error → back to "Add a product" mode.

### `markSoldOut(product)`
Sends `PUT { stock: 0 }`. The backend does partial updates, so only stock changes. There is no "restock" button: use Edit and type a new stock (comment in the code says so).

### `deleteProduct(product)`
Asks `window.confirm(...)` first. The text warns the product also leaves all carts and that setting stock to 0 is safer if customers already ordered it (old orders would show "Deleted product"). If confirmed → `DELETE`, close the edit form if that product was being edited, reload.

### Filtering
```js
const visibleProducts = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
```
Computed on every render, **client side only** (no server call).

## 6. The JSX

- **Form** (`onSubmit={handleSubmit}`): title changes with `editingId ? "Edit product" : "Add a product"`. Fields: name, image path, price (`type="number" step="0.01"`), stock (`step="1"`), keywords, description (`textarea`, `maxLength={2000}` matching the server limit).
- Each field is a **controlled input** (`value` + `onChange`).
- `{error && <p role="alert">...}` shows errors.
- Buttons: submit text = `saving ? "Saving..." : editingId ? "Save changes" : "Add product"`. A **Cancel** button appears only while editing.
- **List header** shows `Products (N)` with N = visible count and the filter input.
- **List:** each `<li key={product.id}>` shows thumbnail, name, `$price · Stock: n`, a "Sold out" label if `stock <= 0`, and buttons. "Mark sold out" is hidden when already sold out.
- `key` must be unique so React can track rows.

## 7. Data flow summary

```
Page opens -> GET /api/products -> products state -> list drawn
Type in form -> form state
Submit -> validate -> POST or PUT -> reload list -> form reset
Delete / Sold out -> request -> reload list
```

## 8. Things to remember

- The page itself does **not** check that you are admin. The server rejects non-admins; a route guard should hide the page.
- `image` is a text path; there is no file upload.
- `rating` is not editable here (server default `{stars:0,count:0}`).
- After a failed `handleSubmit` the form keeps its values so the admin can fix them.
- If `loadProducts` fails there's no error handling (list stays empty).
- CSS: `AdminPage.css` (also reused by `AdminOrdersPage`).

## 9. Test checklist

- [ ] Add product appears in the list
- [ ] Edit loads the right values, Save updates, Cancel resets
- [ ] Price `19.99` becomes `1999` in the request
- [ ] Negative stock or empty stock → error message, no request
- [ ] Mark sold out sets stock 0
- [ ] Delete asks for confirmation
- [ ] Filter narrows the list without a request
