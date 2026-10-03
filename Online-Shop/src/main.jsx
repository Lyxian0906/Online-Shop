import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "../context/AuthContext";
import "../lib/setupAxios";   

import "./index.css";
import App from "../src/App";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<App />
			</AuthProvider>
		</BrowserRouter>
	</StrictMode>,
);

/*
Writtin the axios set up import into the main file is a side-effect import
I needed to import the set up axios because we want it to run once when the file loads
We put it in the main since it's the first web that loads.

What this import actually does?
The server can see who am I unless a request tells it and axios doesn't do that on his own
So the set up teachs axios one rule, before every request we grab the token and attach it.
So we can have access to the cart and to all the things

*/