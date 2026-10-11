# `models/OrderMessage.js` — the chat messages table

## What this file is for
It describes the **`OrderMessages` table**. Each row is one message in the chat between a customer and the store about one order.

## The code, piece by piece

**`id`**: random UUID, primary key. It is the identity of the message.

**`orderId`**
```js
orderId: { type: DataTypes.UUID, allowNull: false }
```
Which order the message belongs to. It is required. It is **not** a formal foreign key, so deleting an order would leave its messages behind. That is why `routes/adminOrders.js` deletes the messages first.

**`senderId`**: who wrote it (the user's id). The chat uses it to put my own messages on the right side.

**`senderRole`**
```js
senderRole: { type: DataTypes.STRING, allowNull: false } // 'customer' or 'admin'
```
Saved with the message so the chat can say "Store" or "Customer", and so the admin page can show "Needs reply" when the last message came from the customer.

**`text`**: `TEXT` (long text). The route limits it to 1000 characters.

**Timestamps:** `createdAt` and `updatedAt` are added automatically. The chat uses `createdAt` to sort and to show the time.

## Words I saw
- **Thread / chat**: all the rows with the same `orderId`.

## Careful
- Who may read or write is not decided here. It is decided in `routes/orderMessages.js` (owner or admin only).
- The text is shown by React as plain text, so HTML typed by someone can't run (React escapes it).

## Build something similar
For comments, notes or chats attached to something: a table with the id of the "thing", who wrote it, and the text.
