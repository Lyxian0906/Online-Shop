import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { formatMoney } from "../../../utils/money";
import axios from "axios";

//Each product has his own state it's won quantity, because we cant have
//the use state inside the loop of map, it breaks the hooks rules

export function Product({ product, loadCart }) {
	const [quantity, setQuantity] = useState(1);
	const [added, setAdded] = useState(false);
	const [cartError, setCartError] = useState("");
	const navigate = useNavigate();

	// The stock number decides if it's sold out (0 or less) and how many we can pick
	const soldOut = product.stock <= 0;
	//New max quantity, stops the dropdown when stock is empty
	const maxQuantity = Math.max(1, Math.min(10, product.stock));
	//When quantity is low we will show a message
	const lowStock = product.stock > 0 && product.stock <= 5;

	const addToCart = async () => {
		setCartError("");

		//We will update it in backend
		//We use async since the backend doesn't load right up
		try {
			await axios.post("/api/cart-items", {
				productId: product.id,
				quantity,
			});
		} catch (error) {
			// 401 = not logged in (or the session expired), so send them to log in
			if (error.response?.status === 401) {
				navigate("/login");
			} else {
				// Any other answer (like "Only 2 in stock.") shows under the button
				setCartError(
					error.response?.data?.error || "Could not add to the cart.",
				);
			}
			return;
		}

		await loadCart(); //We will upload the page without refresh
		//The cart doesn't load right up either

		setAdded(true);
		setTimeout(() => {
			setAdded(false);
		}, 2000);
	};

	const selectQuantity = (event) => {
		//Convert string into number
		const quantitySelected = Number(event.target.value);
		setQuantity(quantitySelected);
	};
	return (
		<div className="product-container" data-testid="product-container">
			<div className="product-image-container">
				<Link to={`/product/${product.id}`}>
					<img
						className="product-image"
						src={product.image}
						data-testid="product-image"
					/>
				</Link>
			</div>

			<div className="product-name limit-text-to-2-lines">
				<Link to={`/product/${product.id}`} className="product-name-link">
					{product.name}
				</Link>
			</div>
			<div className="product-rating-container">
				<img
					className="product-rating-stars "
					data-testid="product-rating-stars-image"
					src={`/images/ratings/rating-${product.rating.stars * 10}.png`}
				/>
				<div className="product-rating-count link-primary">
					{product.rating.count}
				</div>
			</div>
            
			<div className="product-price">
				{formatMoney(product.priceCents)}
				{lowStock && (
					<div className="product-lowstock">Only {product.stock} left</div>
				)}{" "}
			</div>

			<div className="product-quantity-container">
				<select value={quantity} onChange={selectQuantity} disabled={soldOut}>
					{Array.from({ length: maxQuantity }, (_, index) => index + 1).map(
						(number) => (
							<option key={number} value={number}>
								{number}
							</option>
							//It makes one option per number till the maxQuantity
						),
					)}
				</select>
			</div>

			<div className="product-spacer"></div>

			<div className="added-to-cart" style={{ opacity: added ? 1 : 0 }}>
				<img src="/images/icons/checkmark.png" />
				Added
			</div>

			{cartError && (
				<div role="alert" style={{ color: "#b00020", fontSize: 14 }}>
					{cartError}
				</div>
				//If there's any error it appears on the top of the button
			)}

			<button
				className="add-to-cart-button button-primary"
				data-testid="add-to-cart-button"
				onClick={addToCart}
				disabled={soldOut}
			>
				{soldOut ? "Sold out" : "Add to Cart"}
			</button>
		</div>
	);
}
