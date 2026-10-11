# adminOrders.js — Admin Order Panel (Explained for Rebuilding)

---

## 1. What this file is

The back-office for shop admins. It lets them:

1. See **all** orders of **all** customers with extra information (customer email, product details, chat status).
2. **Modify** an order (total, line quantities, delivery dates, remove lines).
3. **Delete** an order together with its chat.

| Operation | URL | Success |
|---|---|---|
| List all | `GET /admin/orders` | 200 array |
| Modify | `PUT /admin/orders/{orderId}` | 200 order |
| Delete | `DELETE /admin/orders/{orderId}` | 204 |

## 2. Security

```js
router.use(requireAuth, requireAdmin);
```

Two checks, in order: (1) the user is logged in, (2) `role === 'admin'`. Because it is `router.use`, **every** route in the file is protected. In your rebuild enforce the admin role on the server — hiding buttons in the UI is not security.

## 3. Data used

| Model | Fields read/written |
|---|---|
| Order | all (read), `totalCostCents` and `products` (write) |
| Profile | `id`, `email` (read) — the customer profile |
| Product | all (read) |
| OrderMessage | `orderId`, `senderRole`, `createdAt` (read), delete |

## 4. GET /admin/orders — the enriched list

### 4.1 The problem

An order row only stores `userId` and product ids. The admin screen needs the customer's **email**, product **names/images**, and whether the customer is **waiting for a reply**. The server collects this in a few queries, then merges them in memory.

### 4.2 Step by step

**Step 1 — all orders, newest first**

```js
const orders = await Order.unscoped().findAll({ order: [['orderTimeMs', 'DESC']] });
```

**Step 2 — customer emails**

```js
const userIds = [...new Set(orders.map(o => o.userId).filter(Boolean))];
const profiles = await Profile.findAll({ where: { id: userIds } });
const emailById = new Map(profiles.map(p => [p.id, p.email]));
```

- `.map` extracts every `userId`.
- `.filter(Boolean)` removes `null`/`undefined` (old orders without a user).
- `new Set(...)` removes duplicates; `[...]` turns the set back into an array.
- `where: { id: userIds }` in Sequelize becomes `WHERE id IN (...)`.
- A `Map` gives fast lookup by id.

**Step 3 — products**

```js
const productIds = [...new Set(orders.flatMap(o => o.products.map(l => l.productId)))];
const products = await Product.findAll({ where: { id: productIds } });
const productById = new Map(products.map(p => [p.id, p]));
```

`flatMap` flattens "array of arrays" into one array (all lines of all orders).

**Step 4 — chat statistics**

```js
const messages = await OrderMessage.findAll({
  where: { orderId: orders.map(o => o.id) },
  attributes: ['orderId', 'senderRole', 'createdAt'],
  order: [['createdAt', 'ASC']]
});
const messageStats = new Map();
for (const m of messages) {
  const prev = messageStats.get(m.orderId);
  messageStats.set(m.orderId, { count: (prev?.count ?? 0) + 1, lastFrom: m.senderRole });
}
```

- Only 3 columns are fetched (lighter than the full text).
- Sorted oldest → newest, so after the loop `lastFrom` holds the role of the **newest** message.
- `prev?.count ?? 0` = "previous count or 0 if none" (optional chaining + default).

SQL equivalent for a rebuild:

```sql
SELECT order_id, COUNT(*) AS count,
       (SELECT sender_role FROM order_messages m2
         WHERE m2.order_id = m.order_id ORDER BY created_at DESC LIMIT 1) AS last_from
FROM order_messages m GROUP BY order_id;
```

**Step 5 — assemble**

```js
const result = orders.map(order => ({
  ...order.toJSON(),
  messageCount: messageStats.get(order.id)?.count ?? 0,
  lastMessageFrom: messageStats.get(order.id)?.lastFrom ?? null,
  userEmail: emailById.get(order.userId) ?? null,
  products: order.products.map(line => ({ ...line, product: productById.get(line.productId) ?? null }))
}));
```

Output per order (extra fields in bold in your head):

```json
{
  "id": "o1", "userId": "u1", "orderTimeMs": 1760000000000, "totalCostCents": 4949,
  "messageCount": 3,
  "lastMessageFrom": "customer",
  "userEmail": "ana@example.com",
  "products": [ { "productId": "p1", "quantity": 2, "estimatedDeliveryTimeMs": 1760600000000,
                  "product": { "name": "Socks", "...": "..." } } ]
}
```

Meaning of nulls: `userEmail: null` → old order with no user; `product: null` → the product was deleted; `lastMessageFrom: null` → no messages. `lastMessageFrom === "customer"` → the customer is waiting for an admin reply (show a badge).

### 4.3 Why this pattern

Doing one query per order/line is the **N+1 problem** (hundreds of queries). Loading related data in a fixed number of queries (here 4) and joining in memory is much faster. In SQL you'd use JOINs; in an ORM, "eager loading"/`include`/`select_related`/`Include()`.

## 5. PUT /admin/orders/{orderId} — modify

Body (both keys optional):

```json
{
  "totalCostCents": 5000,
  "products": [
    { "productId": "p1", "quantity": 3, "estimatedDeliveryTimeMs": 1760900000000 }
  ]
}
```

### Rules

| Rule | Error (400 unless noted) |
|---|---|
| Order must exist | 404 Order not found |
| `totalCostCents` integer ≥ 0 | totalCostCents must be a whole number, 0 or more |
| `products` must be a non-empty array | An order needs at least one product. Delete the order instead. |
| Each `productId` must already be in the order and not repeated | Invalid product in order |
| `quantity` integer ≥ 1 | Quantity must be a whole number, 1 or more |
| `estimatedDeliveryTimeMs` finite number | Invalid delivery date |

### Logic

```
existingIds = set of productIds already in the order
seen = empty set ; updated = []
for line in body.products:
    if line.productId not in existingIds or in seen -> 400
    validate quantity, delivery date
    seen.add(line.productId)
    updated.push({ productId, quantity, estimatedDeliveryTimeMs })   # whitelist fields only
order.products = updated
save
```

Key ideas:
- **Whitelist** — the new line is built from only three known fields, so extra data from the client is ignored.
- Removing a line = leaving it out of the array. Adding a new product is **not** allowed.
- The total is **not recalculated**. The admin sends the new total if lines change. A better rebuild computes it from prices.
- Stock is not adjusted.

## 6. DELETE /admin/orders/{orderId}

```js
await OrderMessage.destroy({ where: { orderId: order.id } });
await order.destroy();
res.status(204).send();
```

Delete the chat first (child rows), then the order (parent). With a DB foreign key `ON DELETE CASCADE` the first line is unnecessary. Stock is **not** returned.

## 7. Pseudocode

```
require login and role == admin for everything below

GET /admin/orders:
    orders = all orders newest first
    emails   = map(userId -> email)      from profiles where id in userIds
    products = map(id -> product)        from products where id in productIds
    stats    = map(orderId -> {count, lastFrom}) from messages
    return orders merged with emails, products, stats

PUT /admin/orders/{id}: validate fields, whitelist lines, save
DELETE /admin/orders/{id}: delete messages, delete order, 204
```

## 8. Rebuild notes

- **Admin dashboards in other tech** (React Admin, Django Admin, Laravel Nova, Retool) already provide most of this; the rules to keep are the validations above.
- **Audit log:** record who changed what (`adminId`, `before`, `after`, `time`) — admins editing money is sensitive.
- **Refund/restock:** add logic when deleting or reducing quantities.
- **Pagination and filters:** `?page=`, `?status=`, `?needsReply=true` because the list loads everything.
- **Order status field:** the original has none (pending/shipped/delivered); adding it is a natural next feature.

## 9. Test checklist

- [ ] Customer token → rejected; no token → 401
- [ ] List contains email, product objects, message counts
- [ ] Deleted product → `product: null`, no crash
- [ ] PUT with an unknown productId → 400
- [ ] PUT with an empty products array → 400
- [ ] Removing a line by omission works
- [ ] DELETE removes the order and its messages
