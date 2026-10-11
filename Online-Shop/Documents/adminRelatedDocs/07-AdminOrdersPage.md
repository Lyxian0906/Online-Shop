# AdminOrdersPage.jsx — Manage orders (edit, delete, chat)

---

## 1. One-sentence summary

The admin screen that lists **every customer order** as an editable card: change the total, quantities and delivery dates, remove lines, delete the order, and chat with the customer.

## 2. Backend calls

| Action | Request | Backend file |
|---|---|---|
| Load all orders | `GET /api/admin/orders` | `adminOrders.js` |
| Save changes | `PUT /api/admin/orders/:id` with `{ totalCostCents, products }` | `adminOrders.js` |
| Delete | `DELETE /api/admin/orders/:id` | `adminOrders.js` |
| Chat | handled inside `<OrderChat />` (uses `/orders/:id/messages`) | `orderMessages.js` |

`OrderChat` lives in `../../components/OrderChat` (not uploaded). It receives `orderId` and an `onSent` callback.

## 3. Structure: two components in one file

```
AdminOrdersPage        <- the whole page: loads the list, filter, renders cards
   └─ OrderCard (one per order)  <- keeps its own editable copy of one order
        └─ OrderChat             <- chat for that order
```

## 4. Helper functions at the top (dates)

```js
const pad = (n) => String(n).padStart(2, '0');   // 5 -> "05"

function msToDateInput(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dateInputToMs(value) {
  return new Date(`${value}T12:00:00`).getTime();
}
```

Why they exist: the server stores delivery dates as **milliseconds** (`estimatedDeliveryTimeMs`), but `<input type="date">` works with text `"2026-10-05"`.

- `msToDateInput`: ms → `"YYYY-MM-DD"`. `getMonth()` is 0-based, so `+ 1`. `pad` adds a leading zero.
- `dateInputToMs`: `"YYYY-MM-DD"` → ms. It uses **12:00 noon** so a time-zone shift can't move the date to the previous/next day.

## 5. `OrderCard` in detail

### Props
`order` (one order object from the server) and `onChanged` (function to reload the list).

### State

```js
const [lines, setLines] = useState(() => order.products.map(line => ({
  productId: line.productId,
  name: line.product?.name ?? 'Deleted product',
  quantity: line.quantity,
  date: msToDateInput(line.estimatedDeliveryTimeMs)
})));
const [total, setTotal] = useState((order.totalCostCents / 100).toFixed(2));
const [error, setError] = useState('');
const [message, setMessage] = useState('');
const [saving, setSaving] = useState(false);
```

| State | Meaning |
|---|---|
| `lines` | the **editable copy** of the order's products (id, name, quantity, date as text) |
| `total` | total in dollars as text (`"49.49"`) |
| `error` / `message` | red error / "Saved" confirmation |
| `saving` | button disabled while saving |

`useState(() => ...)` — passing a **function** means it runs only on the first render (lazy initialization). The card copies the data once, so edits don't change the original until saved.

`line.product?.name ?? 'Deleted product'` — the server returns `product: null` for deleted products, so we show a fallback.

### `updateLine(index, field, value)`
```js
setLines(lines.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
setMessage('');
```
Changes one field of one line, keeps the others. `setMessage('')` hides the old "Saved" because there are now unsaved changes.

### `removeLine(index)`
`lines.filter((_, i) => i !== index)` — builds a new list without that line. (`_` = unused first argument.) The removal only goes to the server on **Save**; the backend treats lines missing from the array as removed.

### `save()`
1. Clear messages.
2. If no lines → error "An order needs at least one product. Delete the order instead." (same rule as the server).
3. `totalCostCents = Math.round(Number(total) * 100)`; invalid → "Enter a valid total, like 35.06".
4. Convert lines:
   ```js
   products = lines.map(l => ({
     productId: l.productId,
     quantity: Number(l.quantity),
     estimatedDeliveryTimeMs: dateInputToMs(l.date)
   }));
   ```
5. `PUT /api/admin/orders/${order.id}` with `{ totalCostCents, products }`.
6. Success → message "Saved". Failure → server's `error` text or generic.
7. `saving` back to false.

Note: the **total is not recalculated** when quantities change. The admin types the new total manually (and the server also doesn't recalc).

### `deleteOrder()`
`window.confirm` → `DELETE` → `await onChanged()` to reload the list (the card disappears). Failure → error text.

### What the card draws
- **Header:** customer email (or "No user (old order)"), a **badge** if there are messages:
  - last message from the customer → class `needs-reply` and text `Needs reply (N)`
  - otherwise `N messages`
  This uses `order.lastMessageFrom` and `order.messageCount` from the server.
- Date and short id: `new Date(order.orderTimeMs).toLocaleString()` and `#{order.id.slice(0, 8)}`.
- **Total** input (`type="number" step="0.01"`).
- **Lines list:** name, Qty input, Delivery date input, Remove button. `key={line.productId}` (unique per order).
- Error / "Saved" messages.
- Buttons **Save changes** and **Delete order**.
- `<OrderChat orderId={order.id} onSent={onChanged} />` — after sending a message the list reloads so the badge updates.

## 6. `AdminOrdersPage` (the parent)

```js
const [orders, setOrders] = useState([]);
const [filter, setFilter] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(true);
```

`loadOrders` does `GET /api/admin/orders`, saves the result (or an error: "Could not load the orders.") and sets `loading` to false. It runs once with `useEffect(..., [])` and is passed to every card as `onChanged`.

### Filter
```js
const search = filter.toLowerCase();
const visibleOrders = orders.filter(o =>
  (o.userEmail ?? '').toLowerCase().includes(search) ||
  o.id.toLowerCase().includes(search));
```
By email or order id, client-side. `?? ''` avoids a crash for old orders without an email.

### Render
Title, `<AdminNav />`, header with count and filter input, error, "Loading orders...", then `<ul>` of `<OrderCard key={order.id} ... />`.

## 7. Important behaviors to remember

- **Cards keep their own state.** After `loadOrders` the card for an existing `order.id` is **not** re-initialized (same `key`), so its inputs keep what you typed. If the server changes an order from elsewhere, you need a refresh of the page to see it in the fields.
- Reloading after a chat message re-renders the list but doesn't clear edits in progress.
- Delivery date input is `required` but `save` is a button with `onClick`, not a form submit, so the browser doesn't enforce it. An empty date gives `NaN` and the server answers "Invalid delivery date".
- Stock isn't changed when deleting or reducing quantities.
- Styles come from `AdminPage.css` and `AdminOrdersPage.css`.

## 8. Data flow

```
Open page -> GET /api/admin/orders -> orders -> one OrderCard each
Edit inputs -> card's lines/total state (nothing sent yet)
Save -> PUT -> "Saved"
Delete -> confirm -> DELETE -> reload list
Chat message sent -> reload list (badge updates)
```

## 9. Test checklist

- [ ] List shows email, date, short id
- [ ] Badge "Needs reply" appears when the last message is from the customer
- [ ] Changing quantity + total and saving persists after reload
- [ ] Removing a line and saving removes it; removing all lines shows the error
- [ ] Dates round-trip correctly (no off-by-one day)
- [ ] Deleted product shows "Deleted product"
- [ ] Delete asks for confirmation and removes the card
