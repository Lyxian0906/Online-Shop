# TODO: Fixes and Features

Work through it top to bottom. Tick each box when done (`- [x]`).

**Order:** Part A (quick fixes) → Part B (cleanup) → Part C (features) → Part D (extras).

---

## Part A: Quick fixes (bugs / warnings) — about 30 min

### A1. Fix the `key` warnings
**Files:** `ProductsGrid.jsx`, `OrderSummary.jsx`, `DeliveryOptions.jsx`
**Problem:** the item returned by `.map()` is a `<>...</>` fragment, but the `key` is on the `<div>` inside it. React warns "each child in a list should have a unique key".
**Fix:** delete the `<>` and `</>` and return the `<div key=...>` directly.

```jsx
// before
return (
  <>
    <div key={product.id} className="product-container"> ... </div>
  </>
);

// after
return (
  <div key={product.id} className="product-container"> ... </div>
);
```

- [ ] `ProductsGrid.jsx`
- [ ] `OrderSummary.jsx` (`key={cartItem.productId}`)
- [ ] `DeliveryOptions.jsx` (`key={deliveryOption.id}`)

### A2. Guard against a missing delivery option
**File:** `OrderSummary.jsx`
**Problem:** if `find()` returns `undefined`, `selectedDeliveryOption.estimatedDeliveryTimeMs` crashes the page.
**Fix:** use optional chaining.

```jsx
{dayjs(selectedDeliveryOption?.estimatedDeliveryTimeMs).format("dddd, MMMM D")}
```

- [ ] Done

### A3. Fix the checkout header count ("3 items")
**Files:** `CheckoutPage.jsx`, `CheckoutHeader.jsx`
**Problem:** the text is hard-coded.
**Fix:** pass the cart and add up the quantities (same as `Header.jsx`).

```jsx
// CheckoutPage.jsx
<CheckoutHeader cart={cart} />

// CheckoutHeader.jsx
export function CheckoutHeader({ cart }) {
  let totalQuantity = 0;
  cart.forEach((item) => { totalQuantity += item.quantity; });
  ...
  <Link className="return-to-home-link" to="/">{totalQuantity} items</Link>
```

- [ ] Done

### A4. Fix the date format (extra comma)
**Files:** `OrderSummary.jsx`, `DeliveryOptions.jsx`
Change `"dddd, MMMM, D"` to `"dddd, MMMM D"`.

- [ ] `OrderSummary.jsx`
- [ ] `DeliveryOptions.jsx`

### A5. Make image paths consistent
**Files:** `Header.jsx`, `CheckoutHeader.jsx`, `ProductsGrid.jsx`, `OrdersDetailGrid.jsx`
**Problem:** some paths are `images/icons/...` (no leading slash). They break on nested routes.
**Fix:** search the project for `src="images/` and change to `src="/images/`.

- [ ] Search with VS Code (`Ctrl+Shift+F`) and replace all

### A6. Check the ESLint `react/prop-types` rule
**File:** `eslint.config.js`
**Problem:** the `react` plugin isn't registered, so this line can throw "Could not find plugin react".
**Fix:** run `npx eslint .`. If it errors, either remove the `'react/prop-types': 'off'` line, or `npm install -D eslint-plugin-react` and register it in `plugins`.

- [ ] Tested
- [ ] Fixed (if needed)

---

## Part B: Cleanup — about 15 min

- [ ] `App.jsx`: rename `serCart` → `setCart` (2 places)
- [ ] `main.jsx`: change `import App from "../src/App"` → `import App from "./App"`
- [ ] Remove unused imports: `Link` in `CheckoutPage.jsx`; `Link` and `Fragment` in `OrdersPage.jsx`
- [ ] Delete `src/data/products.js` (not used) or keep it only if you want offline sample data
- [ ] Decide on naming: `OrdersDetailGrid.jsx` file vs `OrderDetailGrid` component; make them match
- [ ] Empty `App.css`: delete it (and its import) or use it
- [ ] Run `npm run lint` and check there are no errors

---

## Part C: Features to build

### C1. Make `App` able to reload the cart (do this first)
Move the request into a function so other components can refresh the cart after a change.

```jsx
// App.jsx
const [cart, setCart] = useState([]);

const loadCart = async () => {
  const response = await axios.get("/api/cart-items?expand=product");
  setCart(response.data);
};

useEffect(() => { loadCart(); }, []);

<HomePage cart={cart} loadCart={loadCart} />
<CheckoutPage cart={cart} loadCart={loadCart} />
```

- [ ] Done

> **Before C2–C5:** open your backend code and check which routes and body fields it accepts. The ones below are the *likely* ones for this kind of backend; verify them.

### C2. Add to Cart (Home)
**File:** `ProductsGrid.jsx` (+ `HomePage.jsx` passes `loadCart`)
- [ ] Store the selected quantity per product (`useState(1)` in a small `Product` component; that also lets you show "Added" per product)
- [ ] `onChange` on the `<select>` → `setQuantity(Number(event.target.value))`
- [ ] Button `onClick`: `await axios.post("/api/cart-items", { productId: product.id, quantity })`, then `await loadCart()`
- [ ] Show the "Added" message for about 2 seconds (`useState` + `setTimeout`, and check the CSS class that shows it)

### C3. Change delivery option (Checkout)
**File:** `DeliveryOptions.jsx`
- [ ] Add `onChange` to the radio: `await axios.put(\`/api/cart-items/${cartItem.productId}\`, { deliveryOptionId: deliveryOption.id })`
- [ ] Then `await loadCart()`
- [ ] Reload the payment summary too (shipping cost changes). Pass a `loadPaymentSummary` function from `CheckoutPage`.

### C4. Update / Delete cart item (Checkout)
**File:** `CartItems.jsx`
- [ ] Delete: `axios.delete(\`/api/cart-items/${cartItem.productId}\`)` → `loadCart()` + reload payment summary
- [ ] Update: click shows an input; save with `axios.put(..., { quantity })`
- [ ] Show an empty-cart message when `cart.length === 0`

### C5. Place order (Checkout)
**File:** `PaymentSummary.jsx`
- [ ] `useNavigate()` from `react-router`
- [ ] Button `onClick`: `await axios.post("/api/orders")`, then `await loadCart()`, then `navigate("/orders")`
- [ ] Disable the button when the cart is empty

### C6. Orders page: "Add to Cart" (buy again) button
- [ ] Same POST as C2 with `quantity: 1`, then `loadCart()`

### C7. Tracking page
- [ ] Create `pages/tracking/TrackingPage.jsx`
- [ ] Add `<Route path="/tracking" element={<TrackingPage cart={cart} />} />` in `App.jsx`
- [ ] Later: use a route param (`/orders/:orderId/tracking/:productId`) with `useParams()`

### C8. Search (Header)
- [ ] Store the search text (`useState`) and, on button click or Enter, navigate to `/?search=text`
- [ ] In `HomePage`, read it with `useSearchParams()` and request `/api/products?search=text` (if the backend supports it) or filter the products in the front-end by `name` / `keywords`

### C9. "Not found" page
- [ ] `<Route path="*" element={<NotFoundPage />} />`

---

## Part D: Extras (later)

- [ ] Loading and error states: show "Loading..." while requests are pending, and catch errors (`.catch(...)` or `try/catch`)
- [ ] Highlight the active link in the header with the `NavLink` `isActive` class (already using `NavLink`, just style `.active`)
- [ ] Put the repeated quantity `<select>` options in a loop: `[...Array(10).keys()]` → `.map()`
- [ ] Write automated tests (next lessons in the course)
- [ ] Update `docs/` when features are done (especially `03-`, `04-` and `06-`)
- [ ] Deploy (course lesson: AWS). Remember the Vite proxy only works in dev, so the deployed front-end needs the backend URL.

---

## Progress tracker

| Part | Items | Done |
|------|------:|-----:|
| A: Quick fixes | 6 | 0 |
| B: Cleanup | 7 | 0 |
| C: Features | 9 | 0 |
| D: Extras | 6 | 0 |

## Suggested order for your next session

1. **A1 + A2** (10 min): removes console warnings and a possible crash.
2. **A3 + A4 + A5** (15 min): small visible fixes.
3. **C1 → C2**: first real feature (Add to Cart).
4. Commit after each step: `git add . && git commit -m "..." && git push`.
