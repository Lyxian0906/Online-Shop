import axios from "axios";

import "./CheckoutPage.css";

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CheckoutHeader } from "./components/CheckoutHeader";
import { OrderSummary } from "./components/OrderSummary";
import { PaymentSummary } from "./components/PaymentSummary";

export function CheckoutPage({ cart }) {
	const [deliveryOptions, setDeliveryOptions] = useState([]);
	const [paymentSummary, setPaymentSummary] = useState(null);
	useEffect(() => {
		axios
			.get("/api/delivery-options?expand=estimatedDeliveryTime")
			.then((response) => {
				setDeliveryOptions(response.data);
			});
		axios.get("/api/payment-summary").then((response) => {
			setPaymentSummary(response.data);
		});
	}, []);

	return (
		<>
			<title>Checkout</title>
			<CheckoutHeader />
			<div className="checkout-page">
				<div className="page-title">Review your order</div>

				<div className="checkout-grid">
					<OrderSummary cart={cart} deliveryOptions={deliveryOptions} />
					<PaymentSummary  paymentSummary={paymentSummary} />
				</div>
			</div>
		</>
	);
}
