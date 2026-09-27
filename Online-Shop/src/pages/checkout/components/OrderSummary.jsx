import { CartItems } from "./CartItems";
import dayjs from "dayjs";
import axios from "axios";


export function OrderSummary({ cart, deliveryOptions, loadCart }) {
	return (
		<div className="order-summary">
			{deliveryOptions.length > 0 &&
				cart.map((cartItem) => {
					const selectedDeliveryOption = deliveryOptions.find(
						(deliveryOption) => {
							return deliveryOption.id === cartItem.deliveryOptionId;
						},
					);
					const deleteCartItem = async () => {
						await axios.delete(`/api/cart-items/${cartItem.productId}`);
						await loadCart();
					};
					return (
					
							<div key={cartItem.productId} className="cart-item-container">
								<div className="delivery-date">
									Delivery date:{" "}
									{dayjs(selectedDeliveryOption?.estimatedDeliveryTimeMs).format("dddd, MMMM D")}

								</div>

								<CartItems deliveryOptions={deliveryOptions} cartItem={cartItem} loadCart={loadCart} deleteCartItem={deleteCartItem}  />
							</div>
					
					);
				})}
		</div>
	);
}


/*
// Before — crashes when selectedDeliveryOption is undefined
{dayjs(selectedDeliveryOption.estimatedDeliveryTimeMs).format("dddd, MMMM D")}

// After — safe, renders something even when it's undefined
{dayjs(selectedDeliveryOption?.estimatedDeliveryTimeMs).format("dddd, MMMM D")}

This is an extremely common React bug because .find() returning undefined is a totally normal, expected case
(e.g. on first render, before data has loaded, deliveryOptions might be [], so find has nothing to match and returns undefined).

So if we use the ?, this means that if the option is null or not defined, it won't keep trying to access the property
*/