# AdminNav.jsx — The Admin menu

---

## 1. One-sentence summary

A tiny navigation bar with two links, **Products** and **Orders**, shown at the top of every admin page.

## 2. The whole code

```jsx
import { NavLink } from 'react-router';
import './AdminNav.css';

export function AdminNav() {
  return (
    <nav className="admin-nav">
      <NavLink to="/admin" end>Products</NavLink>
      <NavLink to="/admin/orders">Orders</NavLink>
    </nav>
  );
}
```

## 3. Explanation

### `<nav>`
A semantic HTML tag meaning "navigation links". Good for accessibility (screen readers can jump to it).

### `NavLink` vs `Link`
Both change page without reloading. `NavLink` also knows **whether it points to the current page** and automatically adds the CSS class `active` (and `aria-current="page"`) to it. That lets `AdminNav.css` highlight the current tab, e.g.:

```css
.admin-nav a.active { font-weight: bold; border-bottom: 2px solid ...; }
```

### The `end` prop
Without `end`, `NavLink to="/admin"` is considered "active" for `/admin` **and everything under it** (`/admin/orders`). Both tabs would be highlighted on the orders page. `end` means "only active when the URL is exactly `/admin`".

### Routes it expects

| Link | URL | Page component |
|---|---|---|
| Products | `/admin` | `AdminPage.jsx` |
| Orders | `/admin/orders` | `AdminOrdersPage.jsx` |

These routes are defined in your router file (usually `App.jsx`) — not uploaded.

## 4. Where it is used

Both admin pages render `<AdminNav />` right under their `<h1>`:

```jsx
<h1>Manage products</h1>
<AdminNav />
```

## 5. Rebuild / extend notes

- To add another admin section (e.g. Users): add a route and one more `<NavLink>`.
- This component has no state and no props; it is purely presentational.
- It does **not** check that the user is an admin. That protection must be in the route (a guard using `useAuth().isAdmin`) and in the server (`requireAdmin`).

## 6. Test checklist

- [ ] On `/admin` only "Products" is highlighted
- [ ] On `/admin/orders` only "Orders" is highlighted
- [ ] Clicking changes page without a full reload
