import { Header } from "../../components/Header";
import { useEffect } from "react";
import { useState } from "react";
import { ProductsGrid } from "./ProductsGrid";
import axios from "axios";
import "./HomePage.css";

export function HomePage({cart}) {
	const [products, setProducts] = useState([]);
	
	useEffect(() => { 
		axios.get("/api/products").then((response) => {
			setProducts(response.data)
		});
		
	}, []);


	//We can't return 2 pages so we wrap it into a segment

	return (
		<>
			<Header  cart={cart}/>
			<title>Home page</title>

			<div className="home-page">
				<ProductsGrid products={products}/>
			</div>
		</>
	);
}
