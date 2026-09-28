import { formatMoney } from "../../../utils/money";
import { DeliveryOptions } from "./DeliveryOptions";
import { useState } from "react";
import axios from "axios";


export function CartItems({
	cartItem,
	deliveryOptions,
	loadCart,
	deleteCartItem,
}) {
	const [added, setAdded] = useState(false);
	const [quantity, setquantity] = useState(cartItem.quantity);



// Runs every time the user types in the input
    const saveStateQuantity = (event) => {
        setquantity(event.target.value);
    };

    // Runs when the user clicks "Update" / "Save"
    const updateQuantity = async () => {
        if (added) {
            await axios.put(`/api/cart-items/${cartItem.productId}`, {
                quantity: Number(quantity), //We pick the quantity we saved before and updates it, so we can see the number getting updated
            });
            await loadCart(); // refresh the cart with the new data
        }
        setAdded(!added); //We don't need the other function since we put it here plus the put apart js doesn't allow two const with same name

    };

	const keyPress = (event) => {
		if(event.key === 'Enter'){ //If we press enter we update the quantity
			updateQuantity();
		} if (event.key === 'Escape'){ //If we press Escape we exit and leave the previous quantity as it is
			quantity === cartItem.quantity
			setAdded(!added);
		}
	}

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
							<input type="text" className="quantity-input" value={quantity} onChange={saveStateQuantity} onKeyDown={keyPress} />
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
