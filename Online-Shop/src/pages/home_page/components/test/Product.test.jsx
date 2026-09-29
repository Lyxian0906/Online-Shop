import { it, expect, describe, vi } from "vitest"; //describe groups test together (test suite)
import { render, screen } from "@testing-library/react";
import { Product } from "../Product";

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

        expect(
			screen.getByText("$10.90"),
		).toBeInTheDocument();

         expect(
			screen.getByTestId('product-image'),
		).toHaveAttribute('src', 'images/products/re7_p5.png');
        
	});
});

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
