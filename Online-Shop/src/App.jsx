import { useState, useEffect } from "react";
import axios from "axios";
import { HomePage } from "./pages/home_page/HomePage";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { Routes, Route } from "react-router";
import { OrdersPage } from "./pages/orders/OrdersPage";
import { TrackingPage } from "./pages/tracking/TrackingPage";
import { NotFound } from "./pages/notFound/NotFound";
import { LoginPage } from "./pages/login/LoginPage";
window.axios = axios;

//If we take the function out from use effect we can share it with out components by using a promp on the
//component we want it to be used in
function App() {
	const [cart, setCart] = useState([]);
	const loadCart = async () => {
		const response = await axios.get("/api/cart-items?expand=product");
		setCart(response.data);
	};
	useEffect(() => {
		loadCart();
	}, []);
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
				path="tracking/:orderId/:productId"
				element={<TrackingPage cart={cart} />}
			/>
			<Route path="/login" element={<LoginPage />} />
			<Route path="*" element={<NotFound />} />
		</Routes>
	);
}

export default App;
