import './header.css'

export function Header() {
	return (
		<div className="header">
			<div className="left-section">
				<a href="/" className="header-link">
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
				<a className="orders-link header-link" href="/orders">
					<span className="orders-text">Orders</span>
				</a>

				<a className="cart-link header-link" href="/checkout">
					<img className="cart-icon" src="images/icons/cart-icon.png" />
					<div className="cart-quantity">3</div>
					<div className="cart-text">Cart</div>
				</a>
			</div>
		</div>
	);
}
