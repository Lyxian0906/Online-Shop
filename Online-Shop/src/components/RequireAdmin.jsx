import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";


export function RequireAdmin({ children }) {
	const { isLoggedIn, isAdmin, loading } = useAuth();

	if (loading) {
		return null; // still checking who you are
	}

	if (!isLoggedIn) {
		return <Navigate to="/login" replace />;
	}

	if (!isAdmin) {
		return <Navigate to="/" replace />;
	}

	return children;
}
/*
Wrap admin-only pages:
 <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
This only hides the page. The real protection is requireAdmin on the server.


*/