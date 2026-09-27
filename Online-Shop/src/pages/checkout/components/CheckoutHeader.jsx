import { Link } from "react-router";

export function CheckoutHeader({ cart }) {
	let totalQuantity = 0;
	cart.forEach((cartItem) => {
		totalQuantity += cartItem.quantity;
	});
	return (
		<div className="checkout-header">
			<div className="header-content">
				<div className="checkout-header-left-section">
					<Link to="/">
						<img className="logo" src="/images/icons/lyxian-logo.png" />
						<img className="mobile-logo" src="/images/icons/favicon.png" />
					</Link>
				</div>

				<div className="checkout-header-middle-section">
					Checkout (
					<Link className="return-to-home-link" to="/">
						{totalQuantity} items
					</Link>
					)
				</div>

				<div className="checkout-header-right-section">
					<img src="images/icons/checkout-lock-icon.png" />
				</div>
			</div>
		</div>
	);
}
