# `models/Order.js` — the orders table

## What this file is for
It describes the **`Orders` table**. One row is one order that a customer placed.

## The code, piece by piece

**`id`**: a random UUID, the primary key (same pattern as Product).

**`orderTimeMs`**
```js
orderTimeMs: { type: DataTypes.BIGINT, allowNull: false }
```
When the order was made, as **milliseconds** (`Date.now()` gives a number like `1723456800000`). That number is too big for a normal `INTEGER`, so it uses `BIGINT` (a very big whole number).

**`userId`**
```js
userId: { type: DataTypes.UUID }
```
Who owns the order. It holds the Supabase user id (the same id as in `Profiles`). It has **no `allowNull: false`**, so old orders without a user can still exist. It also has **no `references`**, so it is not a foreign key (more below).

**`totalCostCents`**: the total paid, in cents. Whole number.

**`products`** (the interesting one)
```js
products: { type: DataTypes.JSON, allowNull: false }
```
A **list stored inside the order**, like:
```json
[ { "productId": "…", "quantity": 2, "estimatedDeliveryTimeMs": 1723716000000 } ]
```
This is a **snapshot** of what was bought. Good: it is simple, and the order keeps its own copy of the quantities and delivery dates even if the cart changes later.
Trade-offs to know:
- The database can't check that those `productId`s still exist. If an admin **deletes a product**, old orders point to nothing (the admin page shows "Deleted product").
- It stores the product id, **not the price**. If the price changes later, an old order still has the right `totalCostCents`, but you can't see the price per line.
- The bigger design would be a separate `OrderItems` table. JSON is the quick version.

**`createdAt`, `updatedAt`** and the `defaultScope` (sort by creation date) are the same as in Product.

## Words I saw
- **BIGINT**: a very big whole number.
- **JSON column**: stores an object or list inside one cell.
- **Snapshot**: a copy of the data at the moment of purchase.
- **Foreign key**: a column the database checks points to a real row elsewhere (`CartItem` has one, `Order.userId` does not).

## Careful
- In `routes/orders.js` the code sorts with `Order.unscoped()` to skip the default scope and sort by `orderTimeMs` instead.
- If you change `products` in code, assign a **new array** (`order.products = newArray`) so Sequelize notices.

## Build something similar
1. One row per order, with the owner's id and the total.
2. Put the items in a JSON column (quick), or in their own table with `orderId` (more correct).
3. Always store money in cents.
