import { Header } from "../../components/Header";
import { useEffect } from "react";
import { useState } from "react";
import { ProductsGrid } from "./components/ProductsGrid";
import { useSearchParams } from "react-router";
import axios from "axios";
import "./HomePage.css";

export function HomePage({ cart, loadCart }) {
	const [products, setProducts] = useState([]);
	const [searchParams] = useSearchParams();
	const search = searchParams.get("search");

	useEffect(() => {
		const getHomeData = async () => {
			const urlPath = search
				? `/api/products?search=${search}`
				: "/api/products";
			const response = await axios.get(urlPath);
			setProducts(response.data);
		};

		getHomeData();
	}, [search]);

	//We can't return 2 pages so we wrap it into a segment

	return (
		<>
			<Header cart={cart} />
			<title>Home page</title>

			<div className="home-page">
				<ProductsGrid products={products} loadCart={loadCart} />
			</div>
		</>
	);
}
