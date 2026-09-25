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
						await axios.delete(`/api/cart-items/${cart.productId}`);
						await loadCart();
					};
					return (
						<>
							<div key={cartItem.productId} className="cart-item-container">
								<div className="delivery-date">
									Delivery date:{" "}
									{dayjs(selectedDeliveryOption.estimatedDeliveryTimeMs).format(
										"dddd, MMMM, D",
									)}
								</div>

								<CartItems deliveryOptions={deliveryOptions} cartItem={cartItem} loadCart={loadCart} deleteCartItem={deleteCartItem}  />
							</div>
						</>
					);
				})}
		</div>
	);
}
