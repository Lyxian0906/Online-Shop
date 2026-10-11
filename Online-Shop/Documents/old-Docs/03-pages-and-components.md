# 3. Pages and Components

Reference for every component. Paths are relative to `src/`.

---

## `main.jsx`
Entry point. Renders `<App />` inside `StrictMode` and `BrowserRouter`. Imports `index.css`.

## `App.jsx`
- **State:** `cart` (array, initially `[]`)
- **Effect:** on mount, `GET /api/cart-items?expand=product` → `cart`
- **Renders:** `<Routes>` with the three routes; passes `cart` to each page.

---

## `components/Header.jsx`

Shared header for Home and Orders.

| | |
|---|---|
| Props | `cart` (array of cart items) |
| Computes | `totalQuantity` = sum of `cartItem.quantity` |
| Renders | Logo (`NavLink` to `/`), search bar + button, *Orders* link, *Cart* link with the quantity badge |
| Styles | `Header.css` |

The search bar is only visual for now.

---

## Home page: `pages/home_page/`

### `HomePage.jsx`
- Props: `cart` (passed on to `Header`)
- State: `products`; loaded from `/api/products` on mount
- Renders: `Header` + `<div className="home-page">` containing `ProductsGrid`

### `components/ProductsGrid.jsx`
- Props: `products`
- For each product renders a card with: image, name (limited to 2 lines), star rating image, rating count, price (`formatMoney`), a quantity `<select>` (1 to 10), an "Added" indicator and an **Add to Cart** button.
- Rating image name is built from the stars: `rating-${stars * 10}.png` (e.g. 4.5 → `rating-45.png`).
- The select, the "Added" message and the button don't have behavior yet.

---

## Checkout page: `pages/checkout/`

### `CheckoutPage.jsx`
- Props: `cart`
- State: `deliveryOptions` (`[]`), `paymentSummary` (`null`)
- Effect on mount: two requests (delivery options with `expand=estimatedDeliveryTime`, and payment summary)
- Renders: `CheckoutHeader`, title "Review your order", then a grid with `OrderSummary` and `PaymentSummary`.

### `components/CheckoutHeader.jsx`
Simplified header: logo linking home, "Checkout (N items)" link and a lock icon. The item count is hard-coded as **"3 items"**; it should use the cart.

### `components/OrderSummary.jsx`
- Props: `cart`, `deliveryOptions`
- Renders nothing until `deliveryOptions.length > 0` (options load asynchronously).
- For every cart item it uses `find()` to get the delivery option whose `id` equals `cartItem.deliveryOptionId`, prints "Delivery date: ..." (`dayjs`, `dddd, MMMM, D`) and renders `CartItems`.

### `components/CartItems.jsx`
- Props: `cartItem`, `deliveryOptions`
- Shows product image, name, price, quantity, and *Update* / *Delete* links (visual only), plus `DeliveryOptions`.

### `components/DeliveryOptions.jsx`
- Props: `cartItem`, `deliveryOptions`
- One radio option per delivery option: date, and price ("FREE Shipping" when `priceCents` is 0, otherwise the formatted price).
- `checked` is true when `deliveryOption.id === cartItem.deliveryOptionId`.
- The radio `name` is `delivery-option-${cartItem.productId}`, so each product has its own radio group.

### `components/PaymentSummary.jsx`
- Props: `paymentSummary` (object or `null`)
- Always shows the title; the rows only appear when `paymentSummary` is not null (`{paymentSummary && (...)}`): items count, product cost, shipping & handling, total before tax, estimated tax (10%), order total, and the **Place your order** button (no behavior yet).

---

## Orders page: `pages/orders/`

### `OrdersPage.jsx`
- Props: `cart` (for `Header`)
- State: `orders`; loaded from `/api/orders?expand=products` on mount
- For each order renders a header (date with `dayjs(...).format("MMMM D")`, total, order ID) and an `OrderDetailGrid`.

### `components/OrdersDetailGrid.jsx` (exports `OrderDetailGrid`)
- Props: `order`
- For each product in the order: image, name, "Arriving on" date, quantity, an **Add to Cart** ("buy again") button, and a **Track package** button wrapped in a `Link` to `/tracking`.
- Uses `Fragment` with a `key` so each product contributes several grid cells.

---

## Utilities

### `utils/money.js`
```js
export function formatMoney(amountCents) {
  return `$${(amountCents / 100).toFixed(2)}`;
}
```
Converts cents to a dollar string (`1090` → `$10.90`). Prices are stored in cents to avoid floating-point errors.

### `data/products.js`
A static array of products (id, image, name, rating, `priceCents`, keywords). The pages now load products from the API, so this file is a leftover from before the backend was added.
