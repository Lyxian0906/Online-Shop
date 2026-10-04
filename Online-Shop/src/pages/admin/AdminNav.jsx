import { NavLink } from 'react-router';
import './AdminNav.css';

// Shown at the top of every admin page.
export function AdminNav() {
  return (
    <nav className="admin-nav">
      <NavLink to="/admin" end>Products</NavLink>
      <NavLink to="/admin/orders">Orders</NavLink>
    </nav>
  );
}
