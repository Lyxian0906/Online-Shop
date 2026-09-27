import { Header } from "../../components/Header";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import axios from "axios";
import dayjs from "dayjs";
import "./Tracking.css";

export function TrackingPage({ cart }) {
	const { orderId, productId } = useParams();
	const [order, setOrder] = useState(null);

	useEffect(() => {
		const fetchTrackingData = async () => {
			const response = await axios.get(
				`/api/orders/${orderId}?expand=products`,
			);
			setOrder(response.data);
		};

		fetchTrackingData();
	}, [orderId]);

	if (!order) {
		return null;
	}

	const orderProduct = order.products.find((orderProduct) => {
		return orderProduct.productId === productId;
	});
	const totalDeliveryTime = orderProduct.estimatedDeliveryTimeMs - order.orderTimeMs;
	const timePassedMs = dayjs().valueOf() - order.orderTimeMs;
	const deliveryPercent = (timePassedMs / totalDeliveryTime) * 100;
	return (
		<>
			<Header cart={cart} />
			<title>Tracking</title>

			<div className={"order-tracking-card"}>
				<div className="tracking-page">
					<div className="order-tracking">
						<Link className="back-to-orders-link link-primary" to="/orders">
							View all orders
						</Link>

						<div className="delivery-date">
							{" "}
							{dayjs(orderProduct.estimatedDeliveryTimeMs).format(
								"dddd, MMMM D",
							)}{" "}
						</div>

						<div className="product-info">{orderProduct.product.name}</div>

						<div className="product-info">{orderProduct.quantity}</div>

						<img className="product-image" src={orderProduct.product.image} />

						<div className="progress-labels-container">
							<div className="progress-label">Preparing</div>
							<div className="progress-label current-status">Shipped</div>
							<div className="progress-label">Delivered</div>
						</div>

						<div className="progress-bar-container">
							<div
								className="progress-bar"
								style={{ width: `${deliveryPercent}%` }}
							></div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
