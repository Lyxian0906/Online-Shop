import axios from "axios";

import "./CheckoutPage.css";
import "./checkout-header.css";

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CheckoutHeader } from "./components/CheckoutHeader";
import { OrderSummary } from "./components/OrderSummary";
import { PaymentSummary } from "./components/PaymentSummary";

export function CheckoutPage({ cart, loadCart }) {
	const [deliveryOptions, setDeliveryOptions] = useState([]);
	const [paymentSummary, setPaymentSummary] = useState(null);
	useEffect(() => {
		const fetchCheckoutData = async () => {
			let response = await axios.get(
				"/api/delivery-options?expand=estimatedDeliveryTime",
			);

			setDeliveryOptions(response.data);

			response = await axios.get("/api/payment-summary");
			setPaymentSummary(response.data);
		};
		fetchCheckoutData();
	}, [cart]);

/*
If we left the dependency array empty if would only run the use effect once
and that was only when the component mounts when it first loads.


Now if we put cart it will reload everytime the cart changes. So this will allow us to 
modify the delivery options and this will update the payment summary after the cart is updated.

We could also separete it into a function and the used it in the other component like we did with loadCart()

NOTE
I need to separate both components in differents use effects since we don't need to çupdate the deliveryOptions 
everytime.
*/

	return (
		<>
			<title>Checkout</title>
			<CheckoutHeader />
			<div className="checkout-page">
				<div className="page-title">Review your order</div>

				<div className="checkout-grid">
					<OrderSummary cart={cart} deliveryOptions={deliveryOptions} loadCart={loadCart} />
					<PaymentSummary paymentSummary={paymentSummary} />
				</div>
			</div>
		</>
	);
}
