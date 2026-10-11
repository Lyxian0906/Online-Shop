# 4. API and Data

The backend runs on `http://localhost:3000`. The front-end only makes **GET** requests so far, always with relative URLs that the Vite proxy forwards.

> The data shapes below are **inferred from how the front-end code uses them**. I have not seen the backend, so check the real responses in the browser (e.g. `http://localhost:3000/api/products`).

## Endpoints

| Endpoint | Called from | Purpose |
|----------|-------------|---------|
| `GET /api/products` | `HomePage` | All products |
| `GET /api/cart-items?expand=product` | `App` | Cart items, each with its full product |
| `GET /api/delivery-options?expand=estimatedDeliveryTime` | `CheckoutPage` | Delivery options with estimated arrival time |
| `GET /api/payment-summary` | `CheckoutPage` | Totals for the current cart |
| `GET /api/orders?expand=products` | `OrdersPage` | Orders with product details |
| `GET /images/...` | `<img>` tags | Product, rating and icon images |

### Query parameters

`?expand=...` asks the backend to add related data to the response:

- `expand=product` adds a `product` object to each cart item.
- `expand=estimatedDeliveryTime` adds the estimated delivery time to each delivery option.
- `expand=products` adds product details to each order.

## Data shapes

### Product
```json
{
  "id": "e43638ce-...",
  "image": "images/products/re7_p5.png",
  "name": "Resident Evil 7 Biohard - PS5 Edition",
  "rating": { "stars": 4, "count": 87 },
  "priceCents": 1090,
  "keywords": ["RE7", "Capcom", "Zombies"]
}
```

### Cart item (with `expand=product`)
```json
{
  "productId": "...",
  "quantity": 2,
  "deliveryOptionId": "1",
  "product": { "...": "full product object" }
}
```

### Delivery option (with `expand=estimatedDeliveryTime`)
```json
{ "id": "1", "priceCents": 0, "estimatedDeliveryTimeMs": 1790000000000 }
```

### Payment summary
```json
{
  "totalItems": 3,
  "productCostCents": 0,
  "shippingCostCents": 0,
  "totalCostBeforeTaxCents": 0,
  "taxCents": 0,
  "totalCostCents": 0
}
```

### Order (with `expand=products`)
```json
{
  "id": "...",
  "orderTimeMs": 1790000000000,
  "totalCostCents": 0,
  "products": [
    {
      "product": { "id": "...", "image": "...", "name": "..." },
      "quantity": 1,
      "estimatedDeliveryTime": 1790000000000
    }
  ]
}
```

Note the naming difference: delivery options use `estimatedDeliveryTime**Ms**`, order products use `estimatedDeliveryTime`. It's how the code reads them, so keep it in mind if a date shows as invalid.

## Conventions

- **Money** is always in **cents** (`priceCents`, `totalCostCents`, ...) and converted only for display with `formatMoney()`.
- **Dates** are millisecond timestamps, formatted with `dayjs`:
  - Home/Orders: `"MMMM D"` → *September 24*
  - Checkout: `"dddd, MMMM, D"` → *Thursday, September, 24*
- **Rating images:** `/images/ratings/rating-{stars*10}.png` (values `0`, `5`, `10` ... `50`).

## Loading states

Data arrives after the first render, so the components start with empty values and handle them:

| Data | Initial value | Guard in the UI |
|------|---------------|-----------------|
| `products`, `cart`, `orders` | `[]` | `.map()` over an empty array renders nothing |
| `deliveryOptions` | `[]` | `deliveryOptions.length > 0 && cart.map(...)` |
| `paymentSummary` | `null` | `paymentSummary && (...)` |

## Static data

`src/data/products.js` holds 42 sample products in the same shape as the API. It is no longer imported by the pages. Some of its `keywords` don't match the product (e.g. *Zelda Breath Of the Wild* has `"toaster"`), which matters if you use them for search later.

## Planned write operations

Not implemented yet, but the UI already has the controls for them: add to cart, update/delete quantity, change delivery option, place order. They would need POST / PUT / DELETE requests with `axios`, then a refresh of the affected state.
