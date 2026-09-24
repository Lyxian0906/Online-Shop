# Lesson 7: React with Backend, Data Fetching

**Dates:** 09/21/2026 (Day 6) – 09/24/2026 (Day 9)

---

## Day 6 (09/21/2026): Backend and fetching

### Why a backend?

- Better than typing each product into the JS file: save everything in one place and loop over it.
- In a real shop it doesn't make sense to save products on our own computer. The store sets up a **datacenter** and saves all the products there; when a client logs into the website, the datacenter sends only the necessary ones.
- That computer = **Backend**.
- The same applies to the **cart**: it is saved in the backend, so a client can access it from another PC.

### `.map()`

Takes each item from an array and **transforms** it. Used to turn a list of products into a list of components.

### `.toFixed(2)`

To show **2 decimals** for numbers such as prices, use `.toFixed(2)`.

### Asynchronous code

**Asynchronous code** = code that does **not finish right away**.

### `fetch()`

- Lets us get data from a web address.
- Returns a **promise**, which lets asynchronous code finish.
- After `fetch` finishes, it runs the `.then()` function.
- `response.json()` gives us the data attached to the response.
- Problem: `response.json()` is also asynchronous, so we can't save it directly in a variable. We use `.then` **again**.
- Shortcut: instead of nesting two `.then`, **return the second one** (chain them).

```js
fetch("http://localhost:3000/api/products")
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### `axios`

A **cleaner way** to make requests to the backend (no separate `response.json()` step).

```js
axios.get("/api/products").then((response) => {
  console.log(response.data);
});
```

---

## `useEffect()`

- Lets us **control when some code runs**. By default it runs whenever something is created or updated.
- We can control it by adding a **dependency array** as the second argument.
- `[]` = empty, so it **only runs once**.

```jsx
useEffect(() => {
  axios.get("/api/products").then((response) => {
    setProducts(response.data);
  });
}, []);
```

> **Note:** In the console it may show **twice**. That's because `<StrictMode>` makes `useEffect` run twice to catch bugs (**only during development**).

---

## Day 7 (09/22/2026): Getting cart items

```js
axios.get("http://localhost:3000/api/cart-items");
```

- `/api/cart-items` is the **URL path**; it gives us the cart data that is stored in the database.
- **API** = Application Programming Interface. Starting the path with `/api` makes clear that these URL paths are for interacting with the backend.
- To actually show the cart info (e.g. number of items) we have to **save it in a state variable** (`useState`).

### Passing the cart to the Header

The header includes the cart, so to keep every header updated we pass the cart from the page to the `Header` component:

```jsx
<Header cart={cart} />
```

Two ways to use it inside `Header`:

```jsx
// 1) Using props
export function Header(props) {
  const cart = props.cart;
}

// 2) Destructuring (shortcut)
export function Header({ cart }) { }
```

### How to update the cart count?

Loop through the cart and save the total into a value, which is later used in the tag in the header.

### Props validation error

To remove this error, add to the rules in `eslint.config.js`:

```js
rules: {
  'react/prop-types': 'off'
}
```

---

## Lifting the state up

We only need to load the entire cart into the website **once**, so we **lift the state up** (share the cart) to the **`App` component** and pass it down as a prop to each page.

```jsx
function App() {
  const [cart, setCart] = useState([]);
  useEffect(() => {
    axios.get("/api/cart-items?expand=product").then((response) => {
      setCart(response.data);
    });
  }, []);
  return (
    <Routes>
      <Route index element={<HomePage cart={cart} />} />
      <Route path="/checkout" element={<CheckoutPage cart={cart} />} />
      <Route path="/orders" element={<OrdersPage cart={cart} />} />
    </Routes>
  );
}
```

---

## Query parameters

A query parameter lets us **add additional info to our request**.

```
/api/cart-items?expand=product
```

`?expand=product` adds the product details to each cart item.

---

## Checkout page (Days 7–8)

### `name` attribute in radio inputs

Each product needs its **own `name`**, so the radio buttons of one product are grouped together and don't affect other products.

### `checked`

Only the delivery option that **matches the `deliveryOptionId`** will be checked.

### `find()` in delivery options

`find()` loops until it finds the delivery option that matches.

### Delivery options empty

Delivery options load asynchronously, so they may be empty at first. Check before running the code:

```jsx
{deliveryOptions.length > 0 && cart.map((item) => { /* ... */ })}
```

---

## Day 8 (09/23/2026): Payment summary

- `paymentSummary` is an **object**, so it's better to check whether it has loaded (it starts as `null`).
- If it isn't loaded, we don't show it:

```jsx
{paymentSummary && ( /* ... */ )}
```

---

## Day 9 (09/24/2026): Splitting into components

We have a lot of code in the different pages, so we should separate it into **small components**.

Example: **`ProductsGrid`**, which holds the grid of products for the web.

```jsx
// HomePage.jsx
<div className="home-page">
  <ProductsGrid products={products} />
</div>
```

The same idea was applied to the checkout page: `CheckoutHeader`, `OrderSummary`, `PaymentSummary`, and on the orders page: `OrderDetailGrid`.

---

## In your project

Your code already applies these ideas (`useEffect` with `[]`, lifted cart state, `paymentSummary` null-state, `ProductsGrid`). A few small notes:

- `App.jsx`: the setter is named `serCart`, probably a typo for `setCart`. It works, but is worth renaming.
- `CheckoutPage.jsx` imports `Link` but doesn't use it; `OrdersPage.jsx` imports `Link` and `Fragment` unused. Capitalised names are ignored by your ESLint `varsIgnorePattern`, so no error appears, but they can be removed.
- `OrdersPage.jsx` imports `./components/OrdersDetailGrid` while the component is called `OrderDetailGrid`. Fine, as long as the file name matches.
