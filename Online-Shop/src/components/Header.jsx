import "./Header.css";
import { NavLink } from "react-router";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";

export function Header({ cart }) {
	let totalQuantity = 0;
	cart.forEach((cartItem) => {
		totalQuantity += cartItem.quantity;
	});

	const navigate = useNavigate();
	const { isLoggedIn, isAdmin, signOut } = useAuth();
	const [searchParams] = useSearchParams();
	const searchText = searchParams.get("search");

	const [search, setSearch] = useState(searchText || "");

	const updateSearchInput = (event) => {
		setSearch(event.target.value);
	};

	const searchProducts = () => {
		navigate(`/?search=${search}`);
	};
	return (
		<div className="header">
			<div className="left-section">
				<NavLink to="/" className="header-link">
					<img className="logo" src="/images/icons/lyxian-logo.png" />
					<img className="mobile-logo" src="/images/icons/favicon.png" />
				</NavLink>
			</div>

			<div className="middle-section">
				<input
					className="search-bar"
					type="text"
					placeholder="Search"
					value={search}
					onChange={updateSearchInput}
				/>

				<button className="search-button" onClick={searchProducts}>
					<img className="search-icon" src="images/icons/search-icon.png" />
				</button>
			</div>

			<div className="right-section">
				<NavLink className="orders-link header-link" to="/orders">
					<span className="orders-text">Orders</span>
				</NavLink>
				{isAdmin && (
					<NavLink className="orders-link header-link" to="/admin">
						<span className="orders-text">Admin</span>
					</NavLink>
				)}
				{isLoggedIn ? (
					<button
						className="orders-link header-link logout-button"
						onClick={signOut}
					>
						<span className="orders-text">Log out</span>
					</button>
				) : (
					<NavLink className="orders-link header-link" to="/login">
						<span className="orders-text">Log in</span>
					</NavLink>
				)}

				<NavLink className="cart-link header-link" to="/checkout">
					<img className="cart-icon" src="images/icons/cart-icon.png" />
					<div className="cart-quantity">{totalQuantity}</div>
					<div className="cart-text">Cart</div>
				</NavLink>
			</div>
		</div>
	);
}
