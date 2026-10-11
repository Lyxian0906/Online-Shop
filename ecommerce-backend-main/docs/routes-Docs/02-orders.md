# orders.js — Checkout and Order History (Explained for Rebuilding)

> The most important file of the project. It converts a **cart** into an **order** safely, and lets the user read their past orders. Read this one carefully before rebuilding.

---

## 1. What this file is

Three operations, all for the **logged-in user only**:

| Operation | URL | Meaning |
|---|---|---|
| List my orders | `GET /orders` (`?expand=products`) | Order history, newest first |
| Place an order | `POST /orders` | Checkout: cart → order |
| Read one order | `GET /orders/{orderId}` (`?expand=products`) | One order of mine |

## 2. Data model needed

**Order**

| Field | Type | Notes |
|---|---|---|
| id | primary key | |
| userId | foreign key → user | the owner |
| orderTimeMs | integer | creation time in **milliseconds** (`Date.now()`) |
| totalCostCents | integer | final total including shipping and tax |
| products | JSON array | each line: `{ productId, quantity, estimatedDeliveryTimeMs }` |

The product lines are stored **inside** the order as JSON. In a relational rebuild you may prefer a separate table `order_items(orderId, productId, quantity, estimatedDeliveryTimeMs)` — better for reports and foreign keys.

**Also read/written here:** `Product` (price, stock), `DeliveryOption` (price, days), `CartItem` (userId, productId, quantity, deliveryOptionId).

## 3. Why everything is in cents

`totalCostCents = 1999` means 19.99. Binary floating point cannot represent many decimals exactly (`0.1 + 0.2 = 0.30000000000000004`). Integers never have that problem. In another language use integers (or a decimal type) the same way.

## 4. The custom error: `CheckoutError`

```js
class CheckoutError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
```

It represents an *expected* failure (empty cart, sold out). It carries a message and an HTTP status. At the end of checkout:

```js
catch (err) {
  if (err instanceof CheckoutError) return res.status(err.status).json({ error: err.message });
  next(err);   // any other error = real bug -> 500
}
```

Rebuild idea: any exception class with a status code, converted to a response in one place.

## 5. GET /orders — history

```js
let orders = await Order.unscoped().findAll({
  where: { userId: req.user.id },
  order: [['orderTimeMs', 'DESC']]
});
```

- Only orders of the current user (this is the security rule).
- Newest first.
- `unscoped()` disables a default scope on the model (in Sequelize a scope is a reusable default filter). In other ORMs you can ignore this; it just means "plain query".

### The `expand=products` option

An order line only has `productId`. When the client asks `?expand=products` the server loads each product and puts it next to the line:

```js
orders = await Promise.all(orders.map(async (order) => {
  const products = await Promise.all(order.products.map(async (line) => ({
    ...line,
    product: await Product.findByPk(line.productId)
  })));
  return { ...order.toJSON(), products };
}));
```

Result shape:

```json
{
  "id": "o1", "orderTimeMs": 1760000000000, "totalCostCents": 4949,
  "products": [
    { "productId": "p1", "quantity": 2, "estimatedDeliveryTimeMs": 1760600000000,
      "product": { "id": "p1", "name": "Socks", "image": "...", "priceCents": 1000 } }
  ]
}
```

`expand` is a common API pattern: the default response is small, the client opts in to extra data. Rebuild tip: you can make this a single JOIN query instead of N queries.

## 6. POST /orders — checkout (the core)

### 6.1 Requirements

1. The cart must not be empty.
2. Every product must exist and have **enough stock**.
3. Every delivery option must exist.
4. Stock is reduced, the order is created, the cart is cleared.
5. If **anything** fails, **nothing** changes. (Atomicity.)
6. Two customers buying the last unit at the same time must not both succeed.

### 6.2 Transaction

```js
const order = await sequelize.transaction(async (transaction) => { ... });
```

A transaction groups database operations: either all are saved (commit) or none (rollback). If a function inside throws, Sequelize rolls back automatically. Every query inside passes `{ transaction }`.

In other stacks: `BEGIN ... COMMIT/ROLLBACK`, Django `transaction.atomic()`, Spring `@Transactional`, EF Core `BeginTransaction()`, Prisma `$transaction`.

### 6.3 Row lock

```js
const product = await Product.findByPk(item.productId, { transaction, lock: transaction.LOCK.UPDATE });
```

Equivalent SQL: `SELECT ... FROM products WHERE id = ? FOR UPDATE;`. The row is locked until the transaction ends. A second checkout wanting the same product waits, then reads the *updated* stock. Without the lock you get a race condition (overselling).

For databases without row locks (SQLite), use an atomic update instead:

```sql
UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty;
-- if affected rows = 0 -> not enough stock
```

### 6.4 Algorithm in order

```
START TRANSACTION
cart = cartItems where userId = me
if cart is empty -> error 400 "Cart is empty"

total = 0 ; lines = []
for each item in cart:
    product = products.get(item.productId) WITH LOCK
    if not product -> 400 "Product not found: <id>"
    if product.stock < item.quantity:
        if product.stock == 0 -> 409 "Sold out: <name>"
        else                   -> 409 "Only <n> left of <name>"
    delivery = deliveryOptions.get(item.deliveryOptionId)
    if not delivery -> 400 "Invalid delivery option: <id>"

    total += product.priceCents * item.quantity + delivery.priceCents
    product.stock -= item.quantity ; save
    lines.push({ productId, quantity,
                 estimatedDeliveryTimeMs: now + delivery.deliveryDays * 86400000 })

total = round(total * 1.1)                 # 10% tax
order = orders.insert(userId, orderTimeMs = now, totalCostCents = total, products = lines)
cartItems.delete(where userId = me)
COMMIT
return 201 order
```

`24 * 60 * 60 * 1000` = milliseconds in a day (86,400,000).

### 6.5 Formula summary

```
lineCost   = product.priceCents * quantity + delivery.priceCents   (shipping once per cart line)
subtotal   = sum(lineCost)
total      = round(subtotal * 1.10)
```

This must equal the number shown by `paymentSummary.js`. If you change tax or shipping rules, change both (or put them in one shared function).

### 6.6 Status codes used

| Situation | Code |
|---|---|
| Empty cart / bad product / bad delivery option | 400 |
| Sold out / not enough stock | 409 Conflict |
| Success | 201 |

## 7. GET /orders/{orderId}

```js
let order = await Order.findOne({ where: { id: orderId, userId: req.user.id } });
if (!order) return res.status(404).json({ error: 'Order not found' });
```

Putting `userId` in the query means that someone else's order simply "does not exist" for you. `expand=products` works like in the list.

## 8. Rebuild notes for other kinds of projects

- **Stripe/PayPal payments:** create the order as `pending`, then confirm after payment. Keep the stock + order creation in one transaction.
- **Microservices:** checkout touches products, carts and orders; use a saga or keep them in one database.
- **NoSQL (MongoDB):** use multi-document transactions or an atomic `findOneAndUpdate({_id, stock: {$gte: qty}}, {$inc: {stock: -qty}})`.
- **Store the price paid per line** (`unitPriceCents`) so history stays correct even if prices change.
- **Money:** keep integers; round only at the end.
- **Idempotency:** accept an `Idempotency-Key` header so double-clicks don't create two orders.

## 9. Known weaknesses in the original

- The `GET` handlers have no try/catch (on Express 4 an error could hang the request).
- Shipping is per cart line, not per order.
- Delivery time is estimated at creation and never updated except by an admin.

## 10. Test checklist

- [ ] Empty cart → 400
- [ ] Quantity above stock → 409 with the correct message
- [ ] Success reduces stock, creates the order, empties the cart
- [ ] A failure on the 2nd product leaves the 1st product's stock unchanged
- [ ] Two simultaneous checkouts for the last unit → exactly one succeeds
- [ ] User A cannot read User B's order (404)
- [ ] Orders are sorted newest first
