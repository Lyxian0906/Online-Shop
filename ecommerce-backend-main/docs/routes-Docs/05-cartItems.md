# cartItems.js — Shopping Cart (Explained for Rebuilding)

---

## 1. What this file is

Each logged-in user has a private cart. This file lets them read it, add products, change quantity/delivery option, and remove products.

| Operation | URL | Success |
|---|---|---|
| Read cart | `GET /cart-items` (`?expand=product`) | 200 array |
| Add product | `POST /cart-items` | 201 cart item |
| Change item | `PUT /cart-items/{productId}` | 200 cart item |
| Remove item | `DELETE /cart-items/{productId}` | 204 |

The cart is identified by the **user**, never by an id sent by the client.

## 2. Data model

**CartItem**

| Field | Type | Notes |
|---|---|---|
| id | primary key | |
| userId | FK → user | owner |
| productId | FK → product | one row per product per user |
| quantity | integer | ≥ 1 |
| deliveryOptionId | FK → delivery option | default `"1"` |

Recommended in a rebuild: a **unique constraint** on `(userId, productId)` so duplicates are impossible.

## 3. Global protection

```js
router.use(requireAuth);
```

Every route needs login. Every query adds `userId: req.user.id`. That is the whole security model: a user can only see or change rows that carry their own id.

## 4. GET — read cart

```js
let cartItems = await CartItem.findAll({ where: { userId: req.user.id } });
if (req.query.expand === 'product') {
  cartItems = await Promise.all(cartItems.map(async (item) => ({
    ...item.toJSON(), product: await Product.findByPk(item.productId)
  })));
}
res.json(cartItems);
```

With `?expand=product` each item contains its full product so the cart page can render names, images and prices with one request. (In SQL: a JOIN.)

## 5. POST — add to cart

Body: `{ "productId": "...", "quantity": 2 }`

### Checks in order

| Step | Check | Result |
|---|---|---|
| 1 | Product exists | else 400 `Product not found` |
| 2 | `product.stock > 0` | else 409 `Product is sold out` |
| 3 | `quantity` is a number, 1 ≤ q ≤ 10 | else 400 |
| 4 | Look up existing cart row for (user, product) | |
| 5 | `alreadyInCart + quantity ≤ stock` | else 409 with message |
| 6 | If row exists → add to quantity; else create row | 201 |

Message logic for step 5:

```js
const message = alreadyInCart > 0
  ? `Only ${product.stock} in stock, and you already have ${alreadyInCart} in your cart.`
  : `Only ${product.stock} in stock.`;
```

### Merge vs new row

```js
if (cartItem) { cartItem.quantity += quantity; await cartItem.save(); }
else { cartItem = await CartItem.create({ userId, productId, quantity, deliveryOptionId: "1" }); }
```

A product appears once in the cart; clicking "Add to cart" again increases the quantity. New items start with delivery option `"1"` (the default/cheapest). **That id must exist in the delivery options table.**

### Why 409?

`409 Conflict` = the request was valid but conflicts with the current state (stock). `400` is for malformed input.

## 6. PUT — update item

URL has the product id: `PUT /cart-items/{productId}`; body may contain `quantity` and/or `deliveryOptionId`.

```
item = cart row for (me, productId) or 404
if quantity provided:
    must be a number >= 1 (else 400)
    must be <= product.stock (else 409 "Only N in stock.")
    item.quantity = quantity          # SETS, does not add
if deliveryOptionId provided:
    option must exist (else 400 "Invalid delivery option")
    item.deliveryOptionId = deliveryOptionId
save; return item
```

Difference to POST: **POST adds**, **PUT replaces**.

## 7. DELETE — remove

Find the user's row for that product (404 if absent), delete it, return `204`.

## 8. Pseudocode

```
GET    /cart            -> rows where userId = me (+ product details if asked)
POST   /cart            -> validate -> merge or create
PUT    /cart/{product}  -> validate -> update fields sent
DELETE /cart/{product}  -> delete row
```

## 9. Important idea: the cart does not reserve stock

Checks here are for good UX only. Stock is *not* held. Another customer can buy the product before you check out. The authoritative check is in `orders.js` inside a transaction with a lock.

## 10. Rebuild notes

- **Guest carts:** if you want carts without login, store them in `localStorage` or a cookie-based cart id, then merge into the user's cart at login.
- **Frontend-only version:** keep the same rules in a cart store (Redux, Pinia, Zustand), with the server as the source of truth when available.
- **NoSQL:** one cart document per user with an `items` array; same validation logic.
- **Max per click (10):** a business rule; make it a constant.
- **Fixes to apply:** integer check on quantity in both routes; apply the max rule in PUT; unique `(userId, productId)`.

## 11. Test checklist

- [ ] Unknown product → 400
- [ ] Sold-out → 409
- [ ] Quantity 0, 11, "2", 2.5 → rejected (note 2.5 passes in the original; fix it)
- [ ] Adding twice merges into one row
- [ ] Cart + new quantity above stock → 409 with the "already have" message
- [ ] PUT delivery option that does not exist → 400
- [ ] User A cannot see or change user B's cart
