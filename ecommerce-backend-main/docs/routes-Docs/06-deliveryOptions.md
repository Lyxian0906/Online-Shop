# deliveryOptions.js — Shipping Choices (Explained for Rebuilding)

---

## 1. What this file is

A very small, public, read-only endpoint. It returns the list of shipping methods the customer can choose in the cart (e.g. *Free, 7 days*, *Standard, 3 days*, *Express, 1 day*).

| Item | Value |
|---|---|
| URL | `GET /delivery-options` (`?expand=estimatedDeliveryTime`) |
| Auth | None |
| Response | JSON array |

## 2. Data model

**DeliveryOption**

| Field | Type | Example |
|---|---|---|
| id | string | `"1"`, `"2"`, `"3"` |
| deliveryDays | integer | 7, 3, 1 |
| priceCents | integer | 0, 499, 999 |

Typical seed data:

```json
[
  { "id": "1", "deliveryDays": 7, "priceCents": 0 },
  { "id": "2", "deliveryDays": 3, "priceCents": 499 },
  { "id": "3", "deliveryDays": 1, "priceCents": 999 }
]
```

## 3. Code walkthrough

```js
const expand = req.query.expand;
const deliveryOptions = await DeliveryOption.findAll();
let response = deliveryOptions;

if (expand === 'estimatedDeliveryTime') {
  response = deliveryOptions.map(option => {
    const deliveryTimeMs = Date.now() + option.deliveryDays * 24 * 60 * 60 * 1000;
    return { ...option.toJSON(), estimatedDeliveryTimeMs: deliveryTimeMs };
  });
}
res.json(response);
```

1. Load all options.
2. If the client asks for `expand=estimatedDeliveryTime`, add a computed field: **now + deliveryDays**, in milliseconds since 1970 (a Unix timestamp in ms).
3. Send the array.

`option.toJSON()` converts the database object to a plain object so it can be copied with `...` and extended.

### Why compute it on the server?

The server's clock is the reference, so every user sees consistent estimates, and the same formula is used again in checkout (`orders.js`).

The frontend turns the number into a readable date, e.g. `new Date(ms).toLocaleDateString()`.

## 4. Pseudocode

```
GET /delivery-options?expand=estimatedDeliveryTime
    options = db.deliveryOptions.all()
    if expand == "estimatedDeliveryTime":
        for each option: option.estimatedDeliveryTimeMs = now_ms() + option.deliveryDays * 86400000
    return options
```

## 5. Where these options are used (connections)

| File | Use |
|---|---|
| `cartItems.js` | validates the option id; default is `"1"` |
| `paymentSummary.js` | adds the option's price to shipping |
| `orders.js` | uses `deliveryDays` for each line's delivery date; adds the price to the total |
| `reset.js` | seeds the table from `defaultDeliveryOptions.js` |

## 6. Rebuild notes

- **Business days:** this counts calendar days (24 h each). Real shops skip weekends; add a helper `addBusinessDays(date, n)`.
- **Time zones:** timestamps are UTC milliseconds; format in the user's time zone in the UI.
- **Frontend-only:** this can just be a constant array in your code if delivery options never change.
- **Admin editing:** to manage options, add `POST/PUT/DELETE` protected with admin rules and block deleting options in use by carts.
- **Currency:** price in cents like every other price.
- **Cache:** the list rarely changes; you can cache the response (but not the computed estimated times for long).

## 7. Test checklist

- [ ] Works without login
- [ ] Without `expand` the response has no `estimatedDeliveryTimeMs`
- [ ] With `expand` each option has a number about `now + days × 86,400,000`
- [ ] Ids match the ones used as default in the cart (`"1"` exists)
