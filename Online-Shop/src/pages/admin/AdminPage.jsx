import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminPage.css";
import { AdminNav } from "./AdminNav";

const emptyForm = {
	name: "",
	image: "",
	price: "",
	keywords: "",
	description: "",
};

export function AdminPage() {
	const [products, setProducts] = useState([]);
	const [form, setForm] = useState(emptyForm);
	const [editingId, setEditingId] = useState(null);
	const [filter, setFilter] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	const loadProducts = async () => {
		const response = await axios.get("/api/products");
		setProducts(response.data);
	};

	useEffect(() => {
		loadProducts();
	}, []);

	const showError = (err) => {
		setError(err.response?.data?.error || "Something went wrong. Try again.");
	};

	const updateField = (event) => {
		setForm({ ...form, [event.target.name]: event.target.value });
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");

		const priceCents = Math.round(Number(form.price) * 100);
		if (!Number.isFinite(priceCents) || priceCents < 0) {
			setError("Enter a valid price, like 19.99");
			return;
		}

		const body = {
			name: form.name,
			image: form.image,
			priceCents,
			keywords: form.keywords, // the server accepts "a, b, c"
			description: form.description,
		};

		setSaving(true);
		try {
			if (editingId) {
				await axios.put(`/api/products/${editingId}`, body);
			} else {
				await axios.post("/api/products", body);
			}
			setForm(emptyForm);
			setEditingId(null);
			await loadProducts();
		} catch (err) {
			showError(err);
		}
		setSaving(false);
	};

	const startEdit = (product) => {
		setError("");
		setEditingId(product.id);
		setForm({
			name: product.name,
			image: product.image,
			price: (product.priceCents / 100).toFixed(2),
			keywords: product.keywords.join(", "),
			description: product.description ?? "",
		});
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const cancelEdit = () => {
		setEditingId(null);
		setForm(emptyForm);
		setError("");
	};

	const toggleStock = async (product) => {
		setError("");
		const inStock = product.inStock !== false;
		try {
			await axios.put(`/api/products/${product.id}`, { inStock: !inStock });
			await loadProducts();
		} catch (err) {
			showError(err);
		}
	};

	const deleteProduct = async (product) => {
		const sure = window.confirm(
			`Delete "${product.name}"? It will also be removed from every cart. ` +
				"Marking it as sold out is safer if customers already ordered it.",
		);
		if (!sure) return;

		setError("");
		try {
			await axios.delete(`/api/products/${product.id}`);
			if (editingId === product.id) cancelEdit();
			await loadProducts();
		} catch (err) {
			showError(err);
		}
	};

	const visibleProducts = products.filter((product) =>
		product.name.toLowerCase().includes(filter.toLowerCase()),
	);

	return (
		<div className="admin-page">
			<h1>Manage products</h1>
			<AdminNav />

			<form className="admin-form" onSubmit={handleSubmit}>
				<h2>{editingId ? "Edit product" : "Add a product"}</h2>

				<label htmlFor="name">Name</label>
				<input
					id="name"
					name="name"
					value={form.name}
					onChange={updateField}
					required
				/>

				<label htmlFor="image">Image path</label>
				<input
					id="image"
					name="image"
					value={form.image}
					onChange={updateField}
					placeholder="Same format as your other products"
					required
				/>

				<label htmlFor="price">Price</label>
				<input
					id="price"
					name="price"
					type="number"
					min="0"
					step="0.01"
					value={form.price}
					onChange={updateField}
					required
				/>

				<label htmlFor="keywords">Keywords (separated by commas)</label>
				<input
					id="keywords"
					name="keywords"
					value={form.keywords}
					onChange={updateField}
				/>
				<label htmlFor="description">Description</label>
				<textarea
					id="description"
					name="description"
					value={form.description}
					onChange={updateField}
					rows={4}
					maxLength={2000}
				/>
				{error && (
					<p className="admin-error" role="alert">
						{error}
					</p>
				)}

				<div className="admin-form-buttons">
					<button type="submit" className="admin-primary" disabled={saving}>
						{saving ? "Saving..." : editingId ? "Save changes" : "Add product"}
					</button>
					{editingId && (
						<button type="button" onClick={cancelEdit}>
							Cancel
						</button>
					)}
				</div>
			</form>

			<div className="admin-list-header">
				<h2>Products ({visibleProducts.length})</h2>
				<input
					type="search"
					placeholder="Filter by name"
					value={filter}
					onChange={(event) => setFilter(event.target.value)}
				/>
			</div>

			<ul className="admin-list">
				{visibleProducts.map((product) => {
					const inStock = product.inStock !== false;
					return (
						<li key={product.id} className="admin-row">
							<img className="admin-thumb" src={product.image} alt="" />

							<div className="admin-info">
								<div className="admin-name">{product.name}</div>
								<div className="admin-meta">
									${(product.priceCents / 100).toFixed(2)}
									{!inStock && <span className="admin-soldout"> Sold out</span>}
								</div>
							</div>

							<div className="admin-actions">
								<button onClick={() => toggleStock(product)}>
									{inStock ? "Mark sold out" : "Back in stock"}
								</button>
								<button onClick={() => startEdit(product)}>Edit</button>
								<button
									className="admin-danger"
									onClick={() => deleteProduct(product)}
								>
									Delete
								</button>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

/*
This page is basically a manage product screen
This page do 2 things, one is showing the products, and the other changing them

This also remember a few things like
the product list from the dataBase
the form, that are the thing u write in the boxes
editingId, which basically is i it's empty is that u are adding a new product, and a productId means you're editing one product
error reads the message of something fails for some reason 

Each of the buttons on this page sends a request to the server
For example if we click the add Product this page calls POST /api/products and creates a product
Same as  to save changes on PUT /api/products/:id 

*/
