import { Header } from "../../components/Header";
import { useEffect } from "react";
import { useState } from "react";
import { ProductsGrid } from "./components/ProductsGrid";
import { Loading } from "../../components/loading/Loading";
import { useSearchParams } from "react-router";
import axios from "axios";
import "./HomePage.css";

export function HomePage({ cart, loadCart }) {
	const [products, setProducts] = useState([]);
	const [searchParams] = useSearchParams();
	const search = searchParams.get("search");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

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

	//We can't return 2 pages so we wrap it into a segment

	return (
		<>
			<Header cart={cart} />
			{loading && <Loading message="Loading products..." />} {}
			{error && <p role="alert">{error}</p>} {}
			{!loading && !error && (
				<div className="home-page">
					<ProductsGrid products={products} loadCart={loadCart} />
				</div>
			)}
		</>
	);
}
