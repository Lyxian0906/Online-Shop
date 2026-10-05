import { useEffect, useState } from 'react';
import axios from 'axios';
import { AdminNav } from './AdminNav';
import { OrderChat } from '../../components/OrderChat';
import './AdminPage.css';
import './AdminOrdersPage.css';

const pad = (number) => String(number).padStart(2, '0');

// milliseconds -> "2026-10-05" (what <input type="date"> understands) msToDateInput turns the milliseconds into a date
function msToDateInput(ms) {
  const date = new Date(ms);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "2026-10-05" -> milliseconds (noon, so time zones can't shift the day) dateInputToMs does the opposite as the upper function
function dateInputToMs(value) {
  return new Date(`${value}T12:00:00`).getTime();
}

// One card per order. It keeps its own copy of the values being edited.
//What this remembers:

/*
lines: the orders products and it's info
total: the total dollars
error messages
*/
function OrderCard({ order, onChanged }) {
  const [lines, setLines] = useState(() =>
    order.products.map((line) => ({
      productId: line.productId,
      name: line.product?.name ?? 'Deleted product',
      quantity: line.quantity,
      date: msToDateInput(line.estimatedDeliveryTimeMs)
    }))
  );
  const [total, setTotal] = useState((order.totalCostCents / 100).toFixed(2));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  //This function basically changes one field of one line and keeps the rest
  const updateLine = (index, field, value) => {
    setLines(lines.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
    setMessage('');
  };

  //taskes out a line of the list
  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
    setMessage('');
  };

  //converts dollars to cents and dato to millisencons the sends a PUT request to orders
  const save = async () => {
    setError('');
    setMessage('');

    if (lines.length === 0) {
      setError('An order needs at least one product. Delete the order instead.');
      return;
    }

    const totalCostCents = Math.round(Number(total) * 100);
    if (!Number.isFinite(totalCostCents) || totalCostCents < 0) {
      setError('Enter a valid total, like 35.06');
      return;
    }

    const products = lines.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
      estimatedDeliveryTimeMs: dateInputToMs(line.date)
    }));

    setSaving(true);
    try {
      await axios.put(`/api/admin/orders/${order.id}`, { totalCostCents, products });
      setMessage('Saved');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    }
    setSaving(false);
  };

  //Delete the card
  const deleteOrder = async () => {
    const sure = window.confirm(
      'Delete this order permanently? The customer will no longer see it in their orders.'
    );
    if (!sure) return;

    try {
      await axios.delete(`/api/admin/orders/${order.id}`);
      await onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    }
  };

  return (
    <li className="order-card">
      <div className="order-header">
        <div>
          <div className="order-user">
            {order.userEmail ?? 'No user (old order)'}
            {order.messageCount > 0 && (
              <span
                className={`order-badge ${order.lastMessageFrom === 'customer' ? 'needs-reply' : ''}`}
              >
                {order.lastMessageFrom === 'customer'
                  ? `Needs reply (${order.messageCount})`
                  : `${order.messageCount} messages`}
              </span>
            )}
          </div>
          <div className="order-meta">
            {new Date(order.orderTimeMs).toLocaleString()} &middot; #{order.id.slice(0, 8)}
          </div>
        </div>

        <label className="order-total">
          Total ($)
          <input
            type="number"
            min="0"
            step="0.01"
            value={total}
            onChange={(event) => { setTotal(event.target.value); setMessage(''); }}
          />
        </label>
      </div>

      <ul className="order-lines">
        {lines.map((line, index) => (
          <li key={line.productId} className="order-line">
            <span className="order-line-name">{line.name}</span>

            <label>
              Qty
              <input
                type="number"
                min="1"
                step="1"
                value={line.quantity}
                onChange={(event) => updateLine(index, 'quantity', event.target.value)}
              />
            </label>

            <label>
              Delivery
              <input
                type="date"
                value={line.date}
                onChange={(event) => updateLine(index, 'date', event.target.value)}
                required
              />
            </label>

            <button type="button" className="admin-danger" onClick={() => removeLine(index)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      {error && <p className="admin-error" role="alert">{error}</p>}
      {message && <p className="order-saved">{message}</p>}

      <div className="order-actions">
        <button type="button" className="admin-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button type="button" className="admin-danger" onClick={deleteOrder}>
          Delete order
        </button>
      </div>

      <OrderChat orderId={order.id} onSent={onChanged} />
    </li>
  );
}

/*
Remembers the orders, filter, error
load the orders and then calls the /api/admin/orders to store the result
Every cart get onChange so after delete the whole liste refresh


*/
export function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const response = await axios.get('/api/admin/orders');
      setOrders(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load the orders.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const search = filter.toLowerCase();
  const visibleOrders = orders.filter((order) =>
    (order.userEmail ?? '').toLowerCase().includes(search) ||
    order.id.toLowerCase().includes(search)
  );

  return (
    <div className="admin-page">
      <h1>Manage orders</h1>
      <AdminNav />

      <div className="admin-list-header">
        <h2>Orders ({visibleOrders.length})</h2>
        <input
          type="search"
          placeholder="Filter by email or order id"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}
      {loading && <p>Loading orders...</p>}

      <ul className="order-list">
        {visibleOrders.map((order) => (
          <OrderCard key={order.id} order={order} onChanged={loadOrders} />
        ))}
      </ul>
    </div>
  );
}
