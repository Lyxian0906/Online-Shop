# 6. Status, Known Issues and Roadmap

## Current status

Front-end **read-only** version: it displays products, cart, delivery options, payment summary and orders from the backend. Nothing writes data back yet.

## Not implemented yet

| Feature | Where it appears | What is missing |
|---------|------------------|-----------------|
| Add to cart | Home (*Add to Cart*), Orders (*Buy again*) | POST request + refresh the `cart` state |
| Quantity selector | Home `<select>` | Store selected value, send it when adding |
| "Added" message | Home | Show briefly after adding |
| Update / delete cart item | Checkout | PUT / DELETE requests |
| Change delivery option | Checkout radio buttons | `onChange` + PUT request, then reload summary |
| Place order | Payment summary | POST `/api/orders`, then redirect to Orders |
| Search | Header | Filter products by name / `keywords` |
| Track package | Orders | `/tracking` route and page |
| Checkout item count | Checkout header | Uses hard-coded "3 items" |

## Known issues in the current code

1. **Missing `key` on the right element.** In `ProductsGrid`, `OrderSummary` and `DeliveryOptions`, the `key` is on the inner `<div>` but the outer element returned by `map` is a `<>...</>` fragment, so React warns about missing keys. Fix: remove the fragment (return the `div` directly) or use `<Fragment key={...}>`.
2. **Radio buttons without `onChange`.** `DeliveryOptions` sets `checked` without `onChange`, so React warns and the option can't be changed. It becomes fine once a change handler exists.
3. **Possible crash in `OrderSummary`.** If a cart item's `deliveryOptionId` doesn't match any option, `find()` returns `undefined` and `selectedDeliveryOption.estimatedDeliveryTimeMs` throws. Guard with `selectedDeliveryOption?.estimatedDeliveryTimeMs`.
4. **Inconsistent image paths.** Some use `/images/...` and others `images/...` (no leading slash). The relative ones only work on top-level routes; a nested route such as `/orders/123` would break them. Use a leading slash everywhere.
5. **Date format typo.** `"dddd, MMMM, D"` prints an extra comma ("Thursday, September, 24"). Probably intended: `"dddd, MMMM D"`.
6. **Naming:** `serCart` in `App.jsx` should be `setCart`.
7. **Unused imports:** `Link` in `CheckoutPage.jsx`, `Link` and `Fragment` in `OrdersPage.jsx`. ESLint ignores capitalised names, so they don't warn.
8. **Import path:** `main.jsx` imports `"../src/App"`; `"./App"` is cleaner.
9. **ESLint config:** the `'react/prop-types': 'off'` rule refers to a plugin that isn't registered; may throw "Could not find plugin react" (see `requirements.md`).
10. **File / component naming:** `OrdersDetailGrid.jsx` exports `OrderDetailGrid` (singular). Works, but is easy to mistype.
11. **Leftover data:** `src/data/products.js` is unused and some keywords don't match their products.

## Suggested next steps

1. Fix the `key` warnings and the `find()` guard (issues 1 and 3), quick wins.
2. Implement **Add to Cart** with `axios.post("/api/cart-items", { productId, quantity })`, then reload the cart. This will require a `loadCart` function in `App` passed down as a prop.
3. Make delivery options changeable and refresh both the cart and the payment summary.
4. Implement **Place your order** and redirect with `useNavigate`.
5. Add the `/tracking` route and page.
6. Make the header search filter products.
7. Add a "not found" (`*`) route.
8. Later in the course: automated testing, deploy on AWS, TypeScript version.

## Maintenance checklist

- [ ] Backend running before the front-end (`ECONNREFUSED` in the Vite terminal means it isn't).
- [ ] `npm install` after pulling new changes.
- [ ] No console warnings for `key` or `checked`.
- [ ] `git add . && git commit && git push` after each working feature.
