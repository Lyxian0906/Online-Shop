import { Header } from "../../components/Header";
import { useEffect } from "react";
import { useState } from "react";
import { ProductsGrid } from "./components/ProductsGrid";
import { ProductFilters } from "./components/ProductFilters";
import { Loading } from "../../components/loading/Loading";
import { useSearchParams } from "react-router";
import axios from "axios";
import "./HomePage.css";

// Returns a sorted COPY of the list. We copy it first because .sort() changes
// the array it is called on, and we never want to change the products in state.
function sortProducts(list, sortBy) {
	const sorted = [...list];

	if (sortBy === "price-asc") {
		sorted.sort((a, b) => a.priceCents - b.priceCents);
	} else if (sortBy === "price-desc") {
		sorted.sort((a, b) => b.priceCents - a.priceCents);
	} else if (sortBy === "rating") {
		// Highest stars first, and if two have the same stars, the one with more ratings
		sorted.sort(
			(a, b) => b.rating.stars - a.rating.stars || b.rating.count - a.rating.count,
		);
	} else if (sortBy === "name") {
		sorted.sort((a, b) => a.name.localeCompare(b.name));
	}
	// "default" = leave the order the server sent

	return sorted;
}

export function HomePage({ cart, loadCart }) {
	const [products, setProducts] = useState([]);
	const [searchParams] = useSearchParams();
	const search = searchParams.get("search");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [sortBy, setSortBy] = useState("default");
	const [inStockOnly, setInStockOnly] = useState(false);
	/*
The loading thing needs to be in a try catch
so we alwaysshow the circle thing whenever our page is loading
then we set it to false so it dissapears

*/
	useEffect(() => {
		const getHomeData = async () => {
			setLoading(true);
			setError("");
			try {
				const urlPath = search
					? `/api/products?search=${search}`
					: "/api/products";
				const response = await axios.get(urlPath);
				setProducts(response.data);
			} catch {
				setError("Could not load the products. Please try again.");
			}
			setLoading(false);
		};
		getHomeData();
	}, [search]);

	// Filtering and sorting happen here in the browser, on the products we already loaded.
	// First we filter (remove what doesn't match), then we sort what is left.
	const filteredProducts = inStockOnly
		? products.filter((product) => product.inStock !== false)
		: products;
	const visibleProducts = sortProducts(filteredProducts, sortBy);

	//We can't return 2 pages so we wrap it into a segment
	/*
Here we use that loading thing,
First we leave the header so it stays while we load the info
As u can see we have three line between the brakets
The first starting with loading, it's basically the one that waits for the products to load
The second that's the error, that appears the error in this case the one we used in the catch
the error appears when we weren't able to have a sucessful request
The last one is when we aren't loading anything anymore and there's no error
so when that happens then we show the products

The && in JSX meas that if something it's true, then we draw
another thing, in this case for example
if loading it's true, then we draw that loading products message

*/
	return (
		<>
			<Header cart={cart} />
			{loading && <Loading message="Loading products..." />} {}
			{error && <p role="alert">{error}</p>} {}
			{!loading && !error && (
				<div className="home-page">
					<ProductFilters
						sortBy={sortBy}
						onSortChange={setSortBy}
						inStockOnly={inStockOnly}
						onInStockChange={setInStockOnly}
					/>

					{visibleProducts.length === 0 ? (
						<p className="no-results">No products match your filters.</p>
					) : (
						<ProductsGrid products={visibleProducts} loadCart={loadCart} />
					)}
				</div>
			)}
		</>
	);
}