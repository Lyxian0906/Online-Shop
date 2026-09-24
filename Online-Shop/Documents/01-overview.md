# 1. Project Overview

## What is it?

A front-end **e-commerce practice app** built with React while following the *React Full Course* (Lessons 6 and 7). It has three pages: a **Home** page with a product grid, a **Checkout** page with the cart, delivery options and payment summary, and an **Orders** page with past orders. All data comes from a separate **backend** running on `localhost:3000`.

The store sells a mix of everyday products and video games (Resident Evil 7, Zelda: Ocarina of Time, Zelda: Breath of the Wild), and uses a custom "lyxian" logo.

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI | React (function components + hooks) |
| Build tool / dev server | Vite (with `@vitejs/plugin-react`) |
| Routing | `react-router` (`BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`) |
| HTTP | `axios` |
| Dates | `dayjs` |
| Styling | Plain CSS, one file per page or component |
| Linting | ESLint (flat config, `react-hooks`, `react-refresh`) |
| Backend | Separate server on port 3000, reached through the Vite proxy |

## Features that work today

- Multi-page navigation without page reloads (Home, Checkout, Orders).
- Product grid loaded from the API, with price formatting and star ratings.
- Cart loaded once in `App` and shared with every page; the header shows the total item count.
- Checkout: one block per cart item with its delivery date, product details, and delivery options (the saved option is pre-selected).
- Payment summary (items, shipping, tax, total), shown only once loaded.
- Orders page: order date, total, ID and the products in each order.
- Responsive layout through CSS media queries.

## Features shown but not connected yet

See [06-status-and-roadmap.md](06-status-and-roadmap.md) for the complete list. In short: *Add to Cart*, *Update*, *Delete*, *Place your order*, *Search*, *Track package* and changing a delivery option are buttons or inputs in the UI without any behavior yet.

## Folder structure

```
src/
├── main.jsx                     # entry point: StrictMode + BrowserRouter
├── App.jsx                      # routes + shared cart state
├── App.css, index.css           # global styles
├── components/
│   ├── Header.jsx / Header.css  # shared header (logo, search, orders, cart)
├── data/
│   └── products.js              # static product list (not used by the pages any more)
├── utils/
│   └── money.js                 # formatMoney()
└── pages/
    ├── home_page/
    │   ├── HomePage.jsx / .css
    │   └── components/ProductsGrid.jsx
    ├── checkout/
    │   ├── CheckoutPage.jsx / .css, checkout-header.css
    │   └── components/  CheckoutHeader, OrderSummary, CartItems,
    │                    DeliveryOptions, PaymentSummary
    └── orders/
        ├── OrdersPage.jsx / .css
        └── components/OrdersDetailGrid.jsx
```

Outside `src/`: `vite.config.js` (proxy), `eslint.config.js`, `package.json`.

## Documentation index

| File | Contents |
|------|----------|
| `01-overview.md` | This file |
| `02-architecture.md` | Entry point, routing, state, data flow, component tree |
| `03-pages-and-components.md` | Every page and component: props, data and behavior |
| `04-api-and-data.md` | Endpoints, data shapes, formatting helpers |
| `05-styling.md` | CSS organization, breakpoints, shared classes |
| `06-status-and-roadmap.md` | Known issues, unfinished features, next steps |

Related files: `lesson-06-...md`, `lesson-07-...md` (course notes), `requirements.md`, `setup-new-computer.md`.
