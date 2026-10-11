# `models/CartItem.js` — the cart table

## What this file is for
It describes the **`CartItems` table**. One row = one product in one user's cart.

## The code, piece by piece

**No `id` here.** If you don't define a primary key, Sequelize adds `id` (a counting number 1, 2, 3...) by itself.

**`productId`**
```js
productId: { type: DataTypes.UUID, allowNull: false, references: { model: 'Products', key: 'id' } }
```
`references` makes it a **foreign key**: the database checks that this id really exists in `Products`.
Consequences (we lived this):
- Postgres **refuses** a cart item for a product that doesn't exist. (SQLite didn't check, which hid the mistake in the course data.)
- You can't delete a product while it is in a cart. That is why `routes/products.js` deletes the cart items first.

**`quantity`**: whole number, required.

**`userId`**
```js
userId: { type: DataTypes.UUID }
```
Whose cart it is. This is what lets every user have their own cart. It is not a foreign key because the user lives in Supabase Auth, not in one of my tables.

**`deliveryOptionId`**: `STRING`, required, and a foreign key to `DeliveryOptions` (those ids are `'1'`, `'2'`, `'3'`, which are text).

**`createdAt`, `updatedAt`, `defaultScope`**: same as the other models.

## Words I saw
- **Foreign key (`references`)**: "this value must exist in that other table".
- **Primary key**: the column that identifies a row.

## Careful
- Nothing in the model stops the same user from having **two rows for the same product**. The code avoids it (`findOne` first, then update or create). A **unique index on (userId, productId)** would make the database enforce it.
- Deleting an order does not touch the cart. Checkout empties the cart in `routes/orders.js`.

## Build something similar
Link two things with a foreign key: `references: { model: 'OtherTable', key: 'id' }`, and add the owner's id so each user sees only their rows.
