import { Header } from "../../components/Header";
import { useEffect } from "react";
import { useState } from "react";
import { ProductsGrid } from "./components/ProductsGrid";
import axios from "axios";
import "./HomePage.css";

export function HomePage({ cart }) {
	const [products, setProducts] = useState([]);

	useEffect(() => {
		const getHomeData = async () => {
			const response = await axios.get("/api/products");
			setProducts(response.data);
		};

		getHomeData();
	}, []);

	//We can't return 2 pages so we wrap it into a segment

	return (
		<>
			<Header cart={cart} />
			<title>Home page</title>

			<div className="home-page">
				<ProductsGrid products={products} />
			</div>
		</>
	);
}
