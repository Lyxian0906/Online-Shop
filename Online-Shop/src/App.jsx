import "./App.css";
import { HomePage } from "./pages/home_page/HomePage";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { Routes, Route } from "react-router";
import { OrdersPage } from "./pages/orders/OrdersPage";

function App() {
	return (
		<Routes>
			<Route index element={<HomePage />} />
			<Route path="/checkout" element={<CheckoutPage />} />
			<Route path="/orders" element={<OrdersPage />} />
		</Routes>
	);
}

export default App;
