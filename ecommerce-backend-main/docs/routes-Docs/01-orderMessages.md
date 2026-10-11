# orderMessages.js — Order Chat (Explained for Rebuilding)

> Goal of this document: explain **what the code does and why**, so you can re-implement it in any other language or framework (Python/FastAPI, C#/ASP.NET, Java/Spring, Go, PHP/Laravel, etc.).

---

## 1. What this file is

Every order in the store has a small **chat** between the customer and the shop. This file exposes two operations:

1. **Read** all messages of one order.
2. **Send** a new message to that order.

It is a *sub-resource* of an order: messages only exist inside an order. That is why the URL is nested:

```
GET  /orders/{orderId}/messages
POST /orders/{orderId}/messages
```

## 2. Inputs, outputs, and rules at a glance

| Item | Value |
|---|---|
| Authentication | Required (any logged-in user) |
| Authorization | The user must **own the order**, or be an **admin** |
| Read response | JSON array of messages, oldest first |
| Send body | `{ "text": string }` |
| Send success | `201 Created` + the new message |
| Send errors | `400` empty text · `400` text longer than 1000 chars · `404` order not found / not yours |

## 3. Data model needed

**Order** (read only here): `id`, `userId`

**OrderMessage**:

| Field | Type | Notes |
|---|---|---|
| id | primary key | auto |
| orderId | foreign key → Order.id | which chat |
| senderId | id of the user who wrote it | taken from the session, never from the request body |
| senderRole | `"customer"` or `"admin"` | decides how the UI colors the bubble |
| text | string (max 1000) | trimmed |
| createdAt | timestamp | used to sort |

## 4. Code walkthrough, piece by piece

### 4.1 Router creation with `mergeParams`

```js
const router = express.Router({ mergeParams: true });
```

In Express, the path `/orders/:orderId/messages` is defined where the router is *mounted* (in the main server file). By default a child router cannot see `:orderId`. `mergeParams: true` makes it visible as `req.params.orderId`.

**In other frameworks:** this is just "a route with a path parameter `orderId`". In FastAPI it's `@router.get("/orders/{order_id}/messages")`; in Spring `@GetMapping("/orders/{orderId}/messages")`.

### 4.2 Require login for everything

```js
router.use(requireAuth);
```

`router.use` registers a *middleware* that runs before every route in this file. `requireAuth` verifies the session/token and attaches `req.user = { id, email, role }`. If the user is not logged in it replies `401` and stops.

**In other frameworks:** a dependency / filter / attribute / decorator that runs before the handler (FastAPI `Depends`, ASP.NET `[Authorize]`, Spring Security filter).

### 4.3 The ownership check (second middleware)

```js
router.use(async (req, res, next) => {
  const order = await Order.findByPk(req.params.orderId);
  const allowed = order && (order.userId === req.user.id || req.user.role === 'admin');
  if (!allowed) return res.status(404).json({ error: 'Order not found' });
  req.order = order;
  next();
});
```

Logic in plain words:

```
order = database.find(Order, id = orderId)
if order is missing  -> 404
if order.userId != currentUser.id AND currentUser.role != 'admin' -> 404
store order for the next step
continue
```

Why **404 and not 403**? If you answered `403 Forbidden` for someone else's order and `404` for a nonexistent one, an attacker could try ids and learn which orders exist. Returning the same answer for both leaks nothing.

Why store `req.order`? So the handlers below don't have to query the database again. Rebuild idea: in other frameworks put it in a request-scoped variable, or load it again (a second query is fine, just slightly slower).

The `try/catch` calls `next(err)` so unexpected errors reach the global error handler (a 500 response).

### 4.4 GET — list messages

```js
const messages = await OrderMessage.findAll({
  where: { orderId: req.order.id },
  order: [['createdAt', 'ASC']]
});
res.json(messages);
```

Equivalent SQL:

```sql
SELECT * FROM order_messages WHERE order_id = ? ORDER BY created_at ASC;
```

Oldest first so the frontend can render the conversation top to bottom without sorting.

### 4.5 POST — create a message

```js
const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
if (!text) return res.status(400).json({ error: 'Write a message first' });
if (text.length > 1000) return res.status(400).json({ error: 'Messages can be at most 1000 characters' });
```

Step by step:

1. **Type check.** If `text` is not a string (number, object, missing) it becomes `''`. This avoids crashes on `.trim()`.
2. **Trim.** Removes spaces at both ends, so `"   "` counts as empty.
3. **Empty** → `400`.
4. **Too long** → `400`. (Trimmed length is used.)

```js
const message = await OrderMessage.create({
  orderId: req.order.id,
  senderId: req.user.id,
  senderRole: req.user.role === 'admin' ? 'admin' : 'customer',
  text
});
res.status(201).json(message);
```

Security points:
- `orderId` comes from the **already verified** order, not from the body.
- `senderId` comes from the **session**, not from the body (nobody can pretend to be someone else).
- `senderRole` is calculated; a normal user can never send as `admin`.

## 5. Pseudocode (language independent)

```
function requireOrderAccess(request):
    user = authenticate(request)            # 401 if not logged in
    order = db.orders.get(request.orderId)
    if order is null or (order.userId != user.id and user.role != "admin"):
        return 404 {"error": "Order not found"}
    return order

GET /orders/{orderId}/messages:
    order = requireOrderAccess()
    return db.messages.where(orderId = order.id).orderBy(createdAt asc)

POST /orders/{orderId}/messages:
    order = requireOrderAccess()
    text = trim(body.text) if body.text is a string else ""
    if text == "":          return 400 "Write a message first"
    if length(text) > 1000: return 400 "Messages can be at most 1000 characters"
    msg = db.messages.insert(orderId=order.id, senderId=user.id,
                             senderRole = "admin" if user.role == "admin" else "customer",
                             text=text)
    return 201 msg
```

## 6. Rebuild notes for other kinds of projects

- **Real-time chat (WebSockets / Firebase / Supabase):** keep the same rules. Authorization = owner or admin. Validation = non-empty, ≤1000 chars. Only the transport changes.
- **Mobile app backend:** the endpoints stay identical; the app just calls them.
- **Serverless (AWS Lambda, Cloud Functions):** one function per endpoint; the "access check" becomes a shared helper function.
- **NoSQL (MongoDB, Firestore):** store messages either in a separate collection with `orderId`, or as a sub-collection `orders/{id}/messages`. Query ordered by `createdAt`.
- **Pagination (future):** for long chats add `?limit=50&before=<timestamp>`.
- **Unread markers (future):** add `readAt` to the message; `adminOrders.js` already shows who wrote last.

## 7. Edge cases and ideas

| Case | Current behavior | Possible improvement |
|---|---|---|
| Admin writes in any order | Allowed | Fine |
| Order deleted | Messages deleted by `adminOrders.js` | Use `ON DELETE CASCADE` in the DB |
| Spam | Not limited | Add rate limiting |
| HTML in text | Stored raw | Escape in the frontend when displaying |
| Very long chats | Returns everything | Pagination |

## 8. Checklist to confirm your rebuild works

- [ ] Anonymous request → `401`
- [ ] Owner can read and send
- [ ] Another customer gets `404` on both
- [ ] Admin can read and send; `senderRole` is `admin`
- [ ] Empty / whitespace-only text → `400`
- [ ] 1001 characters → `400`, 1000 characters → `201`
- [ ] Messages come back oldest first
