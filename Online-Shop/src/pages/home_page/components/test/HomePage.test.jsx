import { it, describe, vi, beforeEach, expect } from "vitest"; //describe groups test together (test suite)
import { render, screen, within } from "@testing-library/react";
import { Product } from "../Product";
import { MemoryRouter } from "react-router";
import { HomePage } from "../../HomePage";
import axios from "axios"; /*Fake axios*/

vi.mock("axios");

describe("HomePage component", () => {
	let loadCart;

	beforeEach(() => {
		loadCart = vi.fn();

		axios.get.mockImplementation(async (urlPath) => {
			if (urlPath === "/api/products") {
				return {
					data: [
						{
							id: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
							image: "images/products/re7_p5.png",
							name: "Resident Evil 7 Biohard - PS5 Edition",
							rating: {
								stars: 4,
								count: 87,
							},
							priceCents: 1090,
							keywords: ["RE7", "Capcom", "Zombies"],
						},
						{
							id: "15b6fc6f-327a-4ec4-896f-486349e85a3d",
							image: "images/products/zelds_OOT.png",
							name: "The Legend Of Zelda: Ocarina Of Time",
							rating: {
								stars: 4.5,
								count: 127,
							},
							priceCents: 799,
							keywords: ["nintendo", "zelda"],
						},
					],
				};
			}
		});
	});
	it("displays the products correct", async () => {
		render(
			<MemoryRouter>
				<HomePage cart={[]} loadCart={loadCart} />
			</MemoryRouter>,
		);
		const productContainers = await screen.findAllByTestId("product-container");

		expect(productContainers.length).toBe(2);

		expect(
			within(productContainers[0]).getByText(
				"Resident Evil 7 Biohard - PS5 Edition",
			),
		).toBeInTheDocument();

        expect(
			within(productContainers[1]).getByText(
				"The Legend Of Zelda: Ocarina Of Time",
			),
		).toBeInTheDocument();
	});
});

/*
In the  axios.get needs to return something, we need to return
a response.
So we have to mok the implementation so we are gonna make axios.get whatever we want

We should match what axios.get normally returns, so we return
data. More specifically an array of products.
Also axios is async


Failed to resolve import "react-router" from "src/pages/home_page/HomePage.jsx". Does the file exist?

This error, it's because in our homePage we have a header
the header has a Link tag, a link tag can only work if it's in a router, in
the main.jsx all our app is in a router so that's why it normally works
but our test is NOT in a router so this is why we got this warning


Memory router is specifically for testing

When our HomePage is loading it doesn't have any products till is loaded
fully, so we have to wait, by using the...findAllByTestId we wait for the
page to load, so it becomes async since we WAIT for the products


within(), let us find things within a specific element
or inside an specific element
*/
