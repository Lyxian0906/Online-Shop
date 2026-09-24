# Lesson 6: React Router, Git (Start a New Project)

**Dates:** 09/19/2026 – 09/20/2026 (Day 5)

---

## 1. Git: Starting a New Project

Commands to connect a new project to GitHub, in order:

```bash
git init
git remote add origin <repo-url>
git branch -M main
git add .
```

> **Tip (VS Code):** In the search / find-and-replace box, press the arrow on the left to open *Replace*. This lets you replace all occurrences of a word at once.

---

## 2. Routing

**Routing** lets us create multiple pages in React, using **one single HTML file**.

### Installing

```bash
npm install react-router
```

### Setup

1. In `main.jsx`, wrap the app component with `<BrowserRouter>`.
2. In `App.jsx`, wrap all the pages with `<Routes>`.

```jsx
// main.jsx
<BrowserRouter>
  <App />
</BrowserRouter>
```

```jsx
// App.jsx
<Routes>
  <Route index element={<HomePage />} />
  <Route path="/checkout" element={<CheckoutPage />} />
  <Route path="/orders" element={<OrdersPage />} />
</Routes>
```

### The `<Route>` element

```jsx
<Route path="/" element={<HomePage />}></Route>
```

| Prop      | Meaning                                              |
|-----------|------------------------------------------------------|
| `path`    | Tells React the path (URL) of our page               |
| `element` | Which element or component to display, e.g. `<HomePage />` |

> An empty path `"/"` (or `index`) is the home page.

---

## 3. Links stop working after routing (Day 5, 09/20/2026)

Since we did routing, old links such as `index.html` **no longer work**. They must now point to `"/"`, the same paths we put in our app's routes.

---

## 4. Components

We use components to **reuse code**. Example: the website has a **header** used in multiple pages. Instead of typing it again each time, create it once as a component and use it everywhere.

Steps:
1. Create the component (e.g. `Header`).
2. Import it in every page that needs it.
3. Add the tag in those pages: `<Header />`.

---

## 5. Issues

**Problem:** By default, link elements (`<a>`) **reload the page**. That is fine for multi-page sites, but with routing we don't need it.

**Solution:** Use React Router's `<Link>`, which navigates to another page **without reloading**.

```jsx
<Link to="/orders">Orders</Link>
```

---

## 6. `<NavLink>`

- `NavLink` extends `<Link>` by adding **active state awareness**.
- Automatically applies an `active` class, or passes an `isActive` boolean to styling functions, when the URL matches the `to` path.
- Used in navbars, headers and side-menus.

```jsx
<NavLink to="/orders" className={({ isActive }) => (isActive ? "active" : "")}>
  Orders
</NavLink>
```

---

## In your project

Your `main.jsx` and `App.jsx` already follow this structure (`BrowserRouter` → `Routes` → `Route` for Home, Checkout and Orders).

Small thing: in `main.jsx` you import `App` from `"../src/App"`. Since `main.jsx` is already in `src`, `"./App"` is the cleaner path.
