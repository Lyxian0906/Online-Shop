import { useState, useEffect } from "react";
import axios from "axios";
import { HomePage } from "./pages/home_page/HomePage";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { Routes, Route } from "react-router";
import { OrdersPage } from "./pages/orders/OrdersPage";
import { TrackingPage } from "./pages/tracking/TrackingPage";
import { NotFound } from "./pages/notFound/NotFound";
import { LoginPage } from "./pages/login/LoginPage";
import { RequireAuth } from "./components/RequireAuth";
import { useAuth } from "../context/AuthContext";
import { RequireAdmin } from "./components/RequireAdmin";
import { AdminPage } from "./pages/admin/AdminPage";
import { ForgotPasswordPage } from "./pages/login/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/login/ResetPasswordPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { ProductPage } from "./pages/product/ProductPage";
import { AccountPage } from "./pages/account/AccountPage";

window.axios = axios;

//If we take the function out from use effect we can share it with out components by using a promp on the
//component we want it to be used in
function App() {
	const [cart, setCart] = useState([]);
	const { isLoggedIn } = useAuth();

	const loadCart = async () => {
		if (!isLoggedIn) {
			setCart([]); // logged out = empty cart, no request
			return;
		}
		const response = await axios.get("/api/cart-items?expand=product");
		setCart(response.data);
	};
	useEffect(() => {
		loadCart();
	}, [isLoggedIn]); //We reload the cart whenever someon logs in and logs out

	return (
		<Routes>
			<Route index element={<HomePage cart={cart} loadCart={loadCart} />} />
			<Route
				path="/checkout"
				element={
					<RequireAuth>
						<CheckoutPage cart={cart} loadCart={loadCart} />{" "}
					</RequireAuth>
				}
			/>
			<Route
				path="/orders"
				element={
					<RequireAuth>
						<OrdersPage cart={cart} loadCart={loadCart} />{" "}
					</RequireAuth>
				}
			/>
			<Route
				path="/admin"
				element={
					<RequireAdmin>
						<AdminPage />
					</RequireAdmin>
				}
			/>
			<Route
				path="/product/:productId"
				element={<ProductPage cart={cart} loadCart={loadCart} />}
			/>
			<Route path="/forgot-password" element={<ForgotPasswordPage />} />
			<Route path="/reset-password" element={<ResetPasswordPage />} />
			<Route
				path="tracking/:orderId/:productId"
				element={
					<RequireAuth>
						<TrackingPage cart={cart} />
					</RequireAuth>
				}
			/>
			<Route path="/login" element={<LoginPage />} />
			<Route path="*" element={<NotFound />} />
			<Route
				path="/admin/orders"
				element={
					<RequireAdmin>
						<AdminOrdersPage />
					</RequireAdmin>
				}
			/>

			<Route
				path="/account"
				element={
					<RequireAuth>
						<AccountPage cart={cart} />
					</RequireAuth>
				}
			/>
		</Routes>
	);
}

export default App;
