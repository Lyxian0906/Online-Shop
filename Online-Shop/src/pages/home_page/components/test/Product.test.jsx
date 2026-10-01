import { it, expect, describe, vi } from "vitest"; //describe groups test together (test suite)
import { render, screen } from "@testing-library/react";
import { Product } from "../Product";
import userEvent from "@testing-library/user-event";
import axios from "axios"; /*Fake axios*/
/*This let us simulate events like a clic*/
vi.mock("axios"); /*Mock the whole axios package*/

describe("Prouct Component", () => {
	it("displays the product details correctly", () => {
		const product = {
			id: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
			image: "images/products/re7_p5.png",
			name: "Resident Evil 7 Biohard - PS5 Edition",
			rating: {
				stars: 4,
				count: 87,
			},
			priceCents: 1090,
			keywords: ["RE7", "Capcom", "Zombies"],
		};

		const loadCart = vi.fn();
		render(<Product product={product} loadCart={loadCart} />);

		expect(
			screen.getByText("Resident Evil 7 Biohard - PS5 Edition"),
		).toBeInTheDocument();

		expect(screen.getByText("$10.90")).toBeInTheDocument();

		expect(screen.getByTestId("product-image")).toHaveAttribute(
			"src",
			"images/products/re7_p5.png",
		);

		expect(screen.getByTestId("product-rating-stars-image")).toHaveAttribute(
			"src",
			"/images/ratings/rating-40.png",
		);

		expect(screen.getByText("87")).toBeInTheDocument();
	});

	it("adds a product to the cart", async () => {
		const product = {
			id: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
			image: "images/products/re7_p5.png",
			name: "Resident Evil 7 Biohard - PS5 Edition",
			rating: {
				stars: 4,
				count: 87,
			},
			priceCents: 1090,
			keywords: ["RE7", "Capcom", "Zombies"],
		};

		const loadCart = vi.fn();
		render(<Product product={product} loadCart={loadCart} />);

		const user = userEvent.setup();
		const addToCartButoon = screen.getByTestId("add-to-cart-button");
		await user.click(addToCartButoon);

		expect(axios.post).toHaveBeenCalledWith("/api/cart-items", {
			productId: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
			quantity: 1,
		}
	);
		expect(loadCart).toHaveBeenCalled();
	});
});

/*user.click
Will take sometime to update or to load, so is an
async code.

Once we click the add to cart button this will make a request
to the backend.
Bur in our test we shouldn't contact a backend


*/
/*
    When testing a component we render the component and check
    render, displays the component in the page

     render(<Product />);

    In our tests we shouldn't contact the backend, instead we use a mock
    that create a fake version of a function vi.fn()
*/

/*
    The import screen let us check the fake web page screen


*/
