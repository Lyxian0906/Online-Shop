import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap any page that needs a logged-in user:
//   <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
export function RequireAuth({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return null; // still checking if someone is logged in
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
