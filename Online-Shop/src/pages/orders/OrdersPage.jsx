import "./OrdersPage.css";
import axios from "axios";
import dayjs from "dayjs";
import { Header } from "../../components/Header";
import { useState, useEffect, Fragment } from "react";
import { Link } from "react-router";
import { formatMoney } from "../../utils/money";
import { OrderDetailGrid } from "./components/OrdersDetailGrid";
import { OrdersGrid } from "./components/OrdersGrid";

export function OrdersPage({ cart }) {
	const [orders, setOrders] = useState([]);
	useEffect(() => {
		axios.get("/api/orders?expand=products").then((response) => {
			setOrders(response.data);
		});
	}, []);
	return (
		<>
			<Header cart={cart} />
			<title>Orders</title>

			<div className="orders-page">
				<div className="page-title">Your Orders</div>
				<OrdersGrid order={order}/>
				
			</div>
		</>
	);
}
