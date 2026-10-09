import { useState } from "react";
import { useNavigate } from "react-router";
import { formatMoney } from "../../../utils/money";
import axios from "axios";

//Each product has his own state it's won quantity, because we cant have
//the use state inside the loop of map, it breaks the hooks rules

export function Product({ product, loadCart }) {
	const [quantity, setQuantity] = useState(1);
	const [added, setAdded] = useState(false);
	const navigate = useNavigate();

	const soldOut = product.inStock === false;

	const addToCart = async () => {
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

			<div className="product-price">{formatMoney(product.priceCents)}</div>

			<div className="product-quantity-container">
				<select value={quantity} onChange={selectQuantity} disabled={soldOut}>
					<option value="1">1</option>
					<option value="2">2</option>
					<option value="3">3</option>
					<option value="4">4</option>
					<option value="5">5</option>
					<option value="6">6</option>
					<option value="7">7</option>
					<option value="8">8</option>
					<option value="9">9</option>
					<option value="10">10</option>
				</select>
			</div>

			<div className="product-spacer"></div>

			<div className="added-to-cart" style={{ opacity: added ? 1 : 0 }}>
				<img src="/images/icons/checkmark.png" />
				Added
			</div>

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
