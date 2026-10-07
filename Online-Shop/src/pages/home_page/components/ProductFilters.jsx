import "./ProductFilters.css";

// Only draws the controls. HomePage keeps the values and does the actual sorting.
export function ProductFilters({ sortBy, onSortChange, inStockOnly, onInStockChange }) {
	return (
		<div className="product-filters">
			<label className="product-filters-sort">
				Sort by
				<select
					value={sortBy}
					onChange={(event) => onSortChange(event.target.value)}
				>
					<option value="default">Default</option>
					<option value="price-asc">Price: low to high</option>
					<option value="price-desc">Price: high to low</option>
					<option value="rating">Best rated</option>
					<option value="name">Name: A to Z</option>
				</select>
			</label>

			<label className="product-filters-stock">
				<input
					type="checkbox"
					checked={inStockOnly}
					onChange={(event) => onInStockChange(event.target.checked)}
				/>
				In stock only
			</label>
		</div>
	);
}
