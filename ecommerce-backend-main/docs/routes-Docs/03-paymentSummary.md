# paymentSummary.js — Cart Totals (Explained for Rebuilding)

---

## 1. What this file is

The checkout page needs a price box:

```
Items (3):             $40.00
Shipping & handling:    $4.99
Total before tax:      $44.99
Estimated tax (10%):    $4.50
Order total:           $49.49
```

This file calculates those numbers **on the server**, from the real prices in the database. Never trust totals sent by the browser.

## 2. Contract

| Item | Value |
|---|---|
| URL | `GET /payment-summary` |
| Auth | Required |
| Body | none |
| Response | JSON object (below) |

```json
{
  "totalItems": 3,
  "productCostCents": 4000,
  "shippingCostCents": 499,
  "totalCostBeforeTaxCents": 4499,
  "taxCents": 450,
  "totalCostCents": 4949
}
```

| Field | Meaning |
|---|---|
| totalItems | Sum of quantities in the cart |
| productCostCents | Sum of `price × quantity` |
| shippingCostCents | Sum of each cart line's delivery price |
| totalCostBeforeTaxCents | Products + shipping |
| taxCents | 10 % of the line above, rounded |
| totalCostCents | Before-tax + tax |

## 3. Data used (read only)

- **CartItem**: `userId`, `productId`, `quantity`, `deliveryOptionId`
- **Product**: `priceCents`
- **DeliveryOption**: `priceCents`

Nothing is written to the database.

## 4. Code walkthrough

### 4.1 Auth is placed on the route

```js
router.get('/', requireAuth, async (req, res) => { ... });
```

Here `requireAuth` is added directly to the single route (other files use `router.use`). Same effect.

### 4.2 Load the cart

```js
const cartItems = await CartItem.findAll({ where: { userId: req.user.id } });
```

Only the current user's cart.

### 4.3 Accumulators

```js
let totalItems = 0, productCostCents = 0, shippingCostCents = 0;
```

### 4.4 Loop

```js
for (const item of cartItems) {
  const product = await Product.findByPk(item.productId);
  const deliveryOption = await DeliveryOption.findByPk(item.deliveryOptionId);
  if (!product || !deliveryOption) continue;

  totalItems        += item.quantity;
  productCostCents  += product.priceCents * item.quantity;
  shippingCostCents += deliveryOption.priceCents;
}
```

- If a product or delivery option was deleted, the line is **skipped** instead of crashing.
- Shipping is added **once per cart line** (not multiplied by quantity).

### 4.5 Final math

```js
const totalCostBeforeTaxCents = productCostCents + shippingCostCents;
const taxCents = Math.round(totalCostBeforeTaxCents * 0.1);
const totalCostCents = totalCostBeforeTaxCents + taxCents;
```

`Math.round` rounds to the nearest whole cent (half rounds up for positive numbers).

## 5. Pseudocode

```
GET /payment-summary (logged in):
    items = db.cartItems.where(userId = me)
    n = 0; products = 0; shipping = 0
    for item in items:
        p = db.products.get(item.productId)
        d = db.deliveryOptions.get(item.deliveryOptionId)
        if p is null or d is null: continue
        n        += item.quantity
        products += p.priceCents * item.quantity
        shipping += d.priceCents
    before = products + shipping
    tax    = round(before * 0.10)
    return { totalItems: n, productCostCents: products, shippingCostCents: shipping,
             totalCostBeforeTaxCents: before, taxCents: tax, totalCostCents: before + tax }
```

## 6. A worked example

Cart: 2 × T-shirt (1000 cents each, delivery 499), 1 × Cap (1500 cents, delivery 0).

- totalItems = 3
- productCost = 2000 + 1500 = 3500
- shipping = 499 + 0 = 499
- before tax = 3999
- tax = round(399.9) = 400
- total = 4399

## 7. Must stay consistent with checkout

`orders.js` computes `round(subtotal × 1.1)`. For whole-cent integers this equals `subtotal + round(subtotal × 0.1)`. If you change tax rules, shipping rules or rounding, update both places. Best practice in a rebuild: create **one function** `calculateTotals(cartLines)` and use it in both endpoints.

## 8. Rebuild notes

- **Other languages:** write a pure function `calculateTotals(lines)`; it is easy to unit test.
- **Performance:** the loop does 2 queries per cart line. Replace with a JOIN or load products and delivery options in two `IN (...)` queries.
- **Different tax rules:** add a `TAX_RATE` constant or per-country table.
- **Discount codes:** subtract after `before`, before tax.
- **Frontend only?** If you rebuild as a pure frontend app with a mock backend, still keep this logic in one function so you can swap in a real API later.

## 9. Test checklist

- [ ] Empty cart → all zeros
- [ ] Mixed quantities and delivery options match the worked example
- [ ] Deleted product is skipped, no crash
- [ ] Anonymous request → 401
- [ ] Total equals the `totalCostCents` that `POST /orders` stores
