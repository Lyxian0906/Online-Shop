import './header.css';
import './HomePage.css';

export function HomePage() {
    //We can't return 2 pages so we wrap it into a segment
	return (
		<>
            <Title>Home page</Title>
			<div className="header">
				<div className="left-section">
					<a href="index.html" className="header-link">
						<img className="logo" src="/images/icons/lyxian-logo.png" />
						<img className="mobile-logo" src="/images/icons/lyxian-logo.png" />
					</a>
				</div>

				<div className="middle-section">
					<input className="search-bar" type="text" placeholder="Search" />

					<button className="search-button">
						<img className="search-icon" src="images/icons/search-icon.png" />
					</button>
				</div>

				<div className="right-section">
					<a className="orders-link header-link" href="orders.html">
						<span className="orders-text">Orders</span>
					</a>

					<a className="cart-link header-link" href="checkout.html">
						<img className="cart-icon" src="images/icons/cart-icon.png" />
						<div className="cart-quantity">3</div>
						<div className="cart-text">Cart</div>
					</a>
				</div>
			</div>

			<div className="home-page">
				<div className="products-grid">
					<div className="product-container">
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
								src="images/products/re7_p5.png"
							/>
						</div>

						<div className="product-name limit-text-to-2-lines">
							Resident Evel 7 Biohard - PS5 Edition
						</div>

						<div className="product-rating-container">
							<img
								className="product-rating-stars"
								src="images/ratings/rating-35.png"
							/>
							<div className="product-rating-count link-primary">127</div>
						</div>

						<div className="product-price">$26.38</div>

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

					<div className="product-container">
						<div className="product-image-container">
							<img
								className="product-image"
								src="images/products/zelds_OOT.png"
							/>
						</div>

						<div className="product-name limit-text-to-2-lines">
							The Legend Of Zelda: Ocarina Of Time
						</div>

						<div className="product-rating-container">
							<img
								className="product-rating-stars"
								src="images/ratings/rating-45.png"
							/>
							<div className="product-rating-count link-primary">56</div>
						</div>

						<div className="product-price">$7.99</div>

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
				</div>
			</div>
		</>
	);
}
