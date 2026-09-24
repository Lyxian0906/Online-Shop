# Project Requirements

Requirements for the React e-commerce practice project (Home, Checkout and Orders pages) from Lessons 6 and 7.

---

## 1. Tools

| Tool | Purpose |
|------|---------|
| Node.js + npm | Run Vite, install packages |
| Git | Version control (`git init`, `git remote add origin`, `git branch -M main`, `git add .`) |
| VS Code | Editor |
| A backend server on `localhost:3000` | Provides the `/api` data and `/images` |

## 2. Dependencies

Installed with npm (check `package.json` for exact versions):

```bash
npm install react react-dom react-router axios dayjs
```

| Package | Used for |
|---------|----------|
| `react`, `react-dom` | Core library and rendering (`createRoot`) |
| `react-router` | Routing: `BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink` |
| `axios` | Requests to the backend |
| `dayjs` | Formatting dates (order date in `OrdersPage`) |

### Dev dependencies (Vite template)

`vite`, `@vitejs/plugin-react`, `eslint`, `@eslint/js`, `globals`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

## 3. Configuration

### `vite.config.js`: proxy to the backend

```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api':    { target: 'http://localhost:3000' },
      '/images': { target: 'http://localhost:3000' }
    }
  }
});
```

This is why the code can call `axios.get("/api/products")` without writing `http://localhost:3000`.

### `eslint.config.js`

- Ignores `dist`.
- `no-unused-vars` errors, except names starting with a capital letter or `_`.
- `'react/prop-types': 'off'` was added to remove the props validation error.

> **Heads-up:** the config above only registers `react-hooks` and `react-refresh`. In ESLint's flat config, a rule from a plugin that isn't registered (`react/...`) can itself throw an error such as "Could not find plugin react". If that happens, either remove that line, or install `eslint-plugin-react` and register it under `plugins`.

## 4. Backend API endpoints used

| Endpoint | Used in | Notes |
|----------|---------|-------|
| `GET /api/products` | `HomePage` | List of products |
| `GET /api/cart-items?expand=product` | `App` | Cart with product details |
| `GET /api/delivery-options?expand=estimatedDeliveryTime` | `CheckoutPage` | Delivery options with estimated time |
| `GET /api/payment-summary` | `CheckoutPage` | Object; starts as `null` until loaded |
| `GET /api/orders?expand=products` | `OrdersPage` | Orders with product details |

The backend must be running (port **3000**) before starting the React app.

## 5. Project structure

```
src/
├── main.jsx                # StrictMode + BrowserRouter
├── App.jsx                 # Routes + cart state (lifted up)
├── index.css / App.css
├── components/
│   └── Header.jsx          # shared header (receives cart)
├── utils/
│   └── money.js            # formatMoney
└── pages/
    ├── home_page/
    │   ├── HomePage.jsx (+ HomePage.css)
    │   └── components/ProductsGrid.jsx
    ├── checkout/
    │   ├── CheckoutPage.jsx (+ CheckoutPage.css, checkout-header.css)
    │   └── components/ CheckoutHeader, OrderSummary, PaymentSummary
    └── orders/
        ├── OrdersPage.jsx (+ OrdersPage.css)
        └── components/OrdersDetailGrid.jsx
```

## 6. Running the project

```bash
# 1) Start the backend (port 3000)
# 2) In the React project:
npm install
npm run dev
```

## 7. Concepts required (by lesson)

- **Lesson 6:** Git basics, React Router (`BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`), components.
- **Lesson 7:** `fetch`/`axios`, promises and asynchronous code, `useEffect` with dependency array, `useState`, props and destructuring, lifting state up, query parameters, conditional rendering (`&&`), `map()`, `find()`, `toFixed(2)`.
