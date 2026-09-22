import "./App.css";
import { useState, useEffect } from "react";
import { axios } from "axios";	
import { HomePage } from "./pages/home_page/HomePage";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { Routes, Route } from "react-router";
import { OrdersPage } from "./pages/orders/OrdersPage";


function App() {
	const [cart, serCart] = useState([]);
	useEffect(() => {
		axios.get("/api/cart-items").then((response) => {
			serCart(response.data);
		});
	}, []);
	return (
		<Routes>
			<Route index element={<HomePage cart={cart} />} />
			<Route path="/checkout" element={<CheckoutPage cart={cart} />} />
			<Route path="/orders" element={<OrdersPage />} />
		</Routes>
	);
}

export default App;
