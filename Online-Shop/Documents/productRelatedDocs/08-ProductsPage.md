# ProductsPage.jsx (component `ProductPage`) — Single product page

---

## 1. One-sentence summary

The page for **one product** at `/product/:productId`: it loads the product, shows image, name, rating, price, stock warnings and description, and lets the customer choose a quantity and **Add to Cart**.

> The file is named `ProductsPage.jsx` but the exported component is `ProductPage` (singular). It imports `./ProductPage.css`.

## 2. Props and shared tools

```js
export function ProductPage({ cart, loadCart })
```

| Prop | Meaning |
|---|---|
| `cart` | current cart, passed to `<Header cart={cart} />` (to show the item count) |
| `loadCart` | function from a parent that reloads the cart from the server after adding something |

Hooks from `react-router`:
- `useParams()` → `{ productId }` from the address `/product/:productId`.
- `useNavigate()` → move to another page from code.

Other imports: `axios`, `Header`, `Loading` (spinner component), `formatMoney` (cents → `"$19.99"`), `ProductPage.css`.

## 3. Backend calls

| Action | Request | Backend file |
|---|---|---|
| Load product | `GET /api/products/:productId` | `products.js` |
| Add to cart | `POST /api/cart-items` with `{ productId, quantity }` | `cartItems.js` |

## 4. State

```js
const [product, setProduct] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [quantity, setQuantity] = useState(1);
const [added, setAdded] = useState(false);
const [adding, setAdding] = useState(false);
const [cartError, setCartError] = useState("");
```

| State | Meaning |
|---|---|
| `product` | the product object (null until loaded) |
| `loading` | showing the spinner |
| `error` | problem loading the product (page level) |
| `quantity` | selected number in the dropdown |
| `added` | `true` for 2 seconds after adding, to show "Added" |
| `adding` | request in progress; disables the button |
| `cartError` | problem adding to the cart (e.g. not enough stock) |

Two different error states on purpose: `error` replaces the whole page; `cartError` is a small message under the buy button.

## 5. Loading the product

```js
useEffect(() => {
  const loadProduct = async () => {
    setLoading(true); setError("");
    try {
      const response = await axios.get(`/api/products/${productId}`);
      setProduct(response.data);
    } catch (err) {
      setError(err.response?.status === 404
        ? "We could not find this product."
        : "Could not load the product. Please try again.");
    }
    setLoading(false);
  };
  loadProduct();
}, [productId]);
```

- Dependency `[productId]`: runs when the page opens **and again if the id in the URL changes**.
- A function is defined inside the effect and called right away, because the effect callback itself can't be `async`.
- 404 (including malformed ids, as `products.js` answers 404) → friendly message; anything else → generic message.

## 6. `addToCart`

```js
const addToCart = async () => {
  setAdding(true); setCartError("");
  try {
    await axios.post("/api/cart-items", { productId: product.id, quantity });
  } catch (err) {
    setAdding(false);
    if (err.response?.status === 401) navigate("/login");
    else setCartError(err.response?.data?.error || "Could not add to the cart. Try again.");
    return;
  }
  await loadCart();
  setAdding(false);
  setAdded(true);
  setTimeout(() => setAdded(false), 2000);
};
```

Flow:
1. Disable the button, clear previous cart error.
2. POST to the cart. The backend validates stock, quantity 1–10, and merges with an existing cart row.
3. **401** (not logged in or session expired) → redirect to `/login`. This is how guests are handled: they can browse but are asked to log in on their first "Add to Cart".
4. Other errors (e.g. 409 "Only 3 in stock") → shown from the server's `error`.
5. On success: `await loadCart()` refreshes the cart in the header, then show "Added" for 2 seconds via `setTimeout`.

## 7. Derived values (calculated each render, not state)

```js
const soldOut  = product ? product.stock <= 0 : false;
const maxQuantity = product ? Math.min(10, product.stock) : 1;
const lowStock = product && product.stock > 0 && product.stock <= 5;
```

- `soldOut`: stock 0 → disable select and button, show "Sold out".
- `maxQuantity`: at most 10 (server rule) and never above the stock.
- `lowStock`: 1–5 left → show "Only N left".

Rule of thumb: if a value can be computed from other state, don't make it state.

## 8. Image path fix

```js
const imageSrc = product
  ? product.image.startsWith("/") || product.image.startsWith("http")
    ? product.image
    : `/${product.image}`
  : "";
```

This page's URL is `/product/123`. An image like `images/products/x.jpg` (relative) would be searched at `/product/images/...` and fail. Adding a leading `/` makes it absolute from the site root. Paths already starting with `/` or `http` are untouched.

## 9. What is rendered

Using a fragment `<>...</>` (a wrapper without an extra HTML element):

1. `<Header cart={cart} />` always.
2. `{loading && <Loading message="Loading product..." />}`
3. `{error && (...)}` message plus link "Back to the store".
4. `{!loading && !error && product && (...)}` the real page:
   - Back link `← Back to the store` (`&larr;` is the arrow character).
   - Image (`alt={product.name}`).
   - Name (`h1`).
   - **Rating:** image `/images/ratings/rating-${product.rating.stars * 10}.png` — stars 4.5 → `rating-45.png`; and `"{count} ratings"`.
   - Price: `formatMoney(product.priceCents)`.
   - "Sold out" / "Only N left".
   - Description (`product.description || "No description yet."`).
   - **Quantity select:** options 1…`maxQuantity`, built with `Array.from({ length: maxQuantity }, (_, i) => i + 1)`. `Number(event.target.value)` because select values are strings.
   - **Add to Cart** button: text `soldOut ? "Sold out" : adding ? "Adding..." : "Add to Cart"`, disabled if sold out or adding.
   - "Added" span with `style={{ opacity: added ? 1 : 0 }}` (always in the layout so nothing jumps; CSS probably animates the opacity).
   - `cartError` paragraph with `role="alert"`.

## 10. Things to remember

- If the stock is lower than the quantity currently selected after reload, `quantity` can exceed `maxQuantity` (it is not reset). The server still protects against it.
- The quantity doesn't reset to 1 after adding.
- Rating images must exist for every value (`rating-0.png`, `rating-5.png`... `rating-50.png`), otherwise a broken image shows.
- Ratings display relies on `product.rating` being present (backend sets a default).
- The cart total/stock is validated by the server; this page only gives hints.
- `Header`, `Loading`, `formatMoney` and CSS were not uploaded.

## 11. Data flow

```
URL /product/abc -> useParams -> GET /api/products/abc -> product -> page drawn
Choose quantity -> state
Add to Cart -> POST /api/cart-items -> (401 -> login) or loadCart() -> "Added"
```

## 12. Test checklist

- [ ] Valid id shows the product; invalid id shows "We could not find this product."
- [ ] Image displays even when the DB path has no leading slash
- [ ] Sold-out product disables select and button
- [ ] Stock 3 → dropdown has 1–3 and "Only 3 left" appears
- [ ] Guest clicking Add to Cart goes to `/login`
- [ ] Success refreshes the header count and flashes "Added"
- [ ] Server stock error appears under the button
