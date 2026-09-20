import { Header } from "../../components/Header";
import { products } from "../../data/products";
import "./HomePage.css";

export function HomePage() {
	//We can't return 2 pages so we wrap it into a segment
	return (
		<>
			<Header />
			<title>Home page</title>

			<div className="home-page">
				<div className="products-grid">
					{products.map((product) => {
						return (
							<>
								<div key={product.id}className="product-container">
									<div className="product-image-container">
										<img
											className="product-image"
											src="/images/products/zelda_botw.png"
										/>
									</div>

									<div className="product-name limit-text-to-2-lines">
										Zelda Breath Of the Wild
									</div>

									<div className="product-rating-container">
										<img
											className="product-rating-stars"
											src="/images/ratings/rating-45.png"
										/>
										<div className="product-rating-count link-primary">87</div>
									</div>

									<div className="product-price">$60</div>

									<div className="product-quantity-container">
										<select>
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

									<div className="added-to-cart">
										<img src="/images/icons/checkmark.png" />
										Added
									</div>

									<button className="add-to-cart-button button-primary">
										Add to Cart
									</button>
								</div>

								<div className="product-container">
									<div className="product-image-container">
										<img
											className="product-image"
											src={product.image}
										/>
									</div>

									<div className="product-name limit-text-to-2-lines">
										{product.name}
									</div>

									<div className="product-rating-container">
										<img
											className="product-rating-stars"
											src={`"images/ratings/rating-${product.rating.stars * 10}.png"`}
										/>
										<div className="product-rating-count link-primary">{product.rating.count}</div>
									</div>

									<div className="product-price">${product.priceCents / 100}</div> 

									<div className="product-quantity-container">
										<select>
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

									<div className="added-to-cart">
										<img src="images/icons/checkmark.png" />
										Added
									</div>

									<button className="add-to-cart-button button-primary">
										Add to Cart
									</button>
								</div>
							</>
						);
					})}
				</div>
			</div>
		</>
	);
}
