import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";


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

This page is like a guard that check things.
First we check if loading is still "finding out" who we are so if it's yes, we don't show anything
Then we have isLoggedIn, that chedks if we are loged in, if we aren't it sends us back to /login
At last we have isAdmin which checks if we are logged but we aren't admin, so it sends us back to homePage
*/