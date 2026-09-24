# 5. Styling

Plain CSS, no framework. Each page or component imports its own stylesheet.

## Files

| File | Scope | Lines |
|------|-------|------:|
| `index.css` | Global: body font, resets, shared button classes | 104 |
| `App.css` | Currently empty | 0 |
| `components/Header.css` | Main header (Home, Orders) | 184 |
| `pages/home_page/HomePage.css` | Home page + product grid | 206 |
| `pages/checkout/CheckoutPage.css` | Checkout layout, cart items, delivery options, payment summary | 246 |
| `pages/checkout/checkout-header.css` | Checkout's simplified header | 125 |
| `pages/orders/OrdersPage.css` | Orders list and order details | 261 |

## Global rules (`index.css`)

- Font: `Roboto, Arial`; text colour `rgb(33, 33, 33)`.
- `body` and `p` margins removed.
- `button`, `select` have a pointer cursor; `input`, `select`, `button` inherit the font.

## Shared classes

| Class | Look | Used for |
|-------|------|----------|
| `.button-primary` | White text on green `rgb(25, 135, 84)`, rounded, lighter on hover / active | *Add to Cart*, *Place your order*, *Buy again* |
| `.button-secondary` | Dark text, white background, grey border | *Track package* |
| `.link-primary` | Link-style text | Rating count, *Update*, *Delete* |
| `.limit-text-to-2-lines` | Cuts long product names at two lines | Product cards |

## Layout

- **Home:** CSS grid (`.products-grid`) whose number of columns is reduced by media queries as the screen shrinks.
- **Checkout:** two-column grid (`.checkout-grid`: order summary + payment summary) that becomes one column at 1000px.
- **Orders:** each order is a container with a header row and a grid of product rows (image, details, actions).

## Responsive breakpoints

Mobile-adaptive through `@media (max-width: ...)` rules:

| Breakpoint | Where |
|-----------|-------|
| 2000px, 1600px, 1300px, 1000px | Home grid columns |
| 1000px | Checkout layout and cart items |
| 800px | Header, Home, Orders |
| 675px | Header |
| 575px | Home, Orders, checkout header |
| 450px | Home, Orders |

The header shows `.logo` on desktop and `.mobile-logo` (the favicon) on small screens.

## Images

Icons, product pictures and rating stars are **not in `src/`**. They are served by the backend from `/images/...`:

```
/images/icons/     logo, favicon, search, cart, checkmark, lock, buy-again
/images/products/  product photos
/images/ratings/   rating-0.png ... rating-50.png
```

## Tips for editing styles

- Class names are global, so two files defining `.product-name` affect each other. Prefix a class or scope it under its page container (`.home-page .product-name`) if styles clash.
- Change the brand green in one place per class; it's repeated in `.button-primary` (base, hover and active).
