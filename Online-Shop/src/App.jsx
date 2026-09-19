import "./App.css";
import { HomePage } from "./pages/home_page/HomePage";
import { CheckoutPage } from './pages/checkout/CheckoutPage'
import { Routes, Route } from "react-router";
function App() {
	return (
		<Routes>
      <Route index element={<HomePage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
		</Routes>
	);
}

export default App;
