# `models/DeliveryOption.js` — the delivery options table

## What this file is for
It describes the **`DeliveryOptions` table**: the ways to ship (7 days free, 3 days $4.99, 1 day $9.99). It is a small table that almost never changes. I seeded it with 3 rows.

## The code, piece by piece

**`id`**
```js
id: { type: DataTypes.STRING, primaryKey: true }
```
Here the id is **short text I choose** (`'1'`, `'2'`, `'3'`), not a random UUID, and there is no `defaultValue`. `CartItem.deliveryOptionId` points to it, and the code uses `"1"` as the default option.

**`deliveryDays`**: how many days it takes (whole number).

**`priceCents`**: the shipping price in cents.

**`createdAt`, `updatedAt`, `defaultScope`**: same as always. The `defaultScope` sorts by creation, so the options come out as 1, 2, 3.

## Words I saw
- **Lookup table**: a small table of fixed choices that other tables point to.

## Careful
- Because the ids are text, `CartItem.deliveryOptionId` must also be `STRING`. Types must match across a foreign key.
- Shipping is charged **per cart line** in `paymentSummary` and `orders` (not once per order). That was how the course was built.

## Build something similar
For a fixed list of choices (categories, shipping methods, statuses), make a small table with an id, the values, and seed it once.
