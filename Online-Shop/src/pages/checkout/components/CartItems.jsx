import { formatMoney } from "../../../utils/money";
import { DeliveryOptions } from "./DeliveryOptions";
import { useState } from "react";

export function CartItems({
	cartItem,
	deliveryOptions,
	loadCart,
	deleteCartItem,
}) {
	const [added, setAdded] = useState(false);
	const updateQuantity = () => {
		setAdded(!added);
	};
	
	/*
If the user click on the update button, we run the function update.... so if added is false, like at the start
then !added is true, because added is NOT,
So then if added is true then !added is false

so whenever we run the function it just changes true to false and false to true.

So at first we only show quantity if we click update we can update it, if we click again it dissapear the textbox
and that goes on and on and on....

*/
	return (
		<div className="cart-item-details-grid">
			<img className="product-image" src={cartItem.product.image} />

			<div className="cart-item-details">
				<div className="product-name">{cartItem.product.name}</div>
				<div className="product-price">
					{formatMoney(cartItem.product.priceCents)}
				</div>
				<div className="product-quantity">
					<span>
						Quantity:{" "}
						{added ? (
							<input type="text" className="quantity-input" />
						) : (
							<span className="quantity-label">{cartItem.quantity}</span>
						)}
					</span>
					<span
						className="update-quantity-link link-primary"
						onClick={updateQuantity}
					>
						Update
					</span>
					<span
						className="delete-quantity-link link-primary"
						onClick={deleteCartItem}
					>
						Delete
					</span>
				</div>
			</div>

			<DeliveryOptions
				cartItem={cartItem}
				deliveryOptions={deliveryOptions}
				loadCart={loadCart}
			/>
		</div>
	);
}
/*I need to make the update button*/
