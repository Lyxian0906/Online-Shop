# `routes/orders.js` explained

This is probably the densest route file — it's the only one that reads from multiple tables at once and does real calculations. Walking through `POST /api/orders` (placing an order) piece by piece:

```js
router.post('/', async (req, res) => {
  const cartItems = await CartItem.findAll();

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }
```

Grabs everything currently in the cart. If nothing's there, it stops immediately — no point building an order from nothing.

## The core loop

```js
let totalCostCents = 0;
const products = await Promise.all(cartItems.map(async (item) => {
  const product = await Product.findByPk(item.productId);
  if (!product) {
    throw new Error(`Product not found: ${item.productId}`);
  }
  const deliveryOption = await DeliveryOption.findByPk(item.deliveryOptionId);
  if (!deliveryOption) {
    throw new Error(`Invalid delivery option: ${item.deliveryOptionId}`);
  }
  const productCost = product.priceCents * item.quantity;
  const shippingCost = deliveryOption.priceCents;
  totalCostCents += productCost + shippingCost;
  const estimatedDeliveryTimeMs = Date.now() + deliveryOption.deliveryDays * 24 * 60 * 60 * 1000;
  return {
    productId: item.productId,
    quantity: item.quantity,
    estimatedDeliveryTimeMs
  };
}));
```

This is the part that looks intimidating, but it's really just: **for every item in the cart, look up its product and delivery option, then add up the cost.**

Why `Promise.all(cartItems.map(async (item) => { ... }))` instead of a normal `for` loop? Because each iteration does two `await`s (`Product.findByPk`, `DeliveryOption.findByPk`) — database lookups that take a little time. `.map()` starts all these lookups **at the same time** rather than one after another, and `Promise.all()` waits for every one of them to finish before moving on. If the cart has 5 items, this runs all 5 pairs of lookups in parallel instead of in sequence — faster, but it means you can't use a plain `for` loop here without losing that parallelism (you could, but it'd be slower).

Inside each iteration:
- `product.priceCents * item.quantity` — cost of that many units of that product.
- `deliveryOption.priceCents` — shipping cost for that item's chosen delivery option.
- `totalCostCents += productCost + shippingCost` — running total across *all* cart items, updated from inside the loop (this works fine here because, even though the lookups run in parallel, each iteration's own calculations happen only once its own data has arrived).
- `estimatedDeliveryTimeMs` — "now" plus however many days the delivery option takes, converted to milliseconds (`days × 24 hours × 60 minutes × 60 seconds × 1000 ms`).

What gets returned from each iteration (and collected into `products`) is a **slimmed-down object** — just `productId`, `quantity`, `estimatedDeliveryTimeMs`. Notice it does *not* include full product details (name, image, etc.) — those get looked up again later, only when something actually asks for them via `?expand=products`. This keeps what's stored in the `Order` row small.

## Tax and order creation

```js
totalCostCents = Math.round(totalCostCents * 1.1);

const order = await Order.create({
  orderTimeMs: Date.now(),
  totalCostCents,
  products
});

await CartItem.destroy({ where: {} });
```

- `* 1.1` adds 10% tax on top of the running total.
- `Order.create(...)` saves one row — note that `products` (an array of objects) gets saved as a single field. This only works because the `Order` model almost certainly defines that column as a JSON type, letting Sequelize store a whole array/object inside one database column instead of needing a separate table.
- `CartItem.destroy({ where: {} })` — deletes **every** row in the `CartItem` table (an empty `where` matches everything). This is what empties the cart after checkout.

## The "expand" pattern (used in GET routes too)

```js
if (expand === 'products') {
  const products = await Promise.all(order.products.map(async (product) => {
    const productDetails = await Product.findByPk(product.productId);
    return {
      ...product,
      product: productDetails
    };
  }));
  order = { ...order.toJSON(), products };
}
```

This is the same pattern used in `cartItems.js` and elsewhere: by default, an order only stores `productId`, not full product info. If the request includes `?expand=products` (your frontend does this when it needs to display product names/images), this block fetches the full `Product` record for each item and attaches it under a `product` key — without changing what's permanently stored in the database. It's a cheap way to keep stored data small while still letting the frontend get rich detail when it needs it.
