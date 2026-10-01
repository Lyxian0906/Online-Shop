import express from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { DeliveryOption } from '../models/DeliveryOption.js';
import { CartItem } from '../models/CartItem.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/*
Cheese user
*/
router.use(requireAuth);

router.get('/', async (req, res) => {
  const expand = req.query.expand;
  let orders = await Order.unscoped().findAll({
    where: { userId: req.user.id },
    order: [['orderTimeMs', 'DESC']] // Sort by most recent
  });

  if (expand === 'products') {
    orders = await Promise.all(orders.map(async (order) => {
      const products = await Promise.all(order.products.map(async (product) => {
        const productDetails = await Product.findByPk(product.productId);
        return {
          ...product,
          product: productDetails
        };
      }));
      return {
        ...order.toJSON(),
        products
      };
    }));
  }

  res.json(orders);
});

router.post('/', async (req, res) => {
  const cartItems = await CartItem.findAll({ where: { userId: req.user.id } });

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  let totalCostCents = 0;
  const products = [];

  for (const item of cartItems) {
    const product = await Product.findByPk(item.productId);
    if (!product) {
      return res.status(400).json({ error: `Product not found: ${item.productId}` });
    }
    if (!product.inStock) {
      return res.status(400).json({ error: `Sold out: ${product.name}` });
    }

    const deliveryOption = await DeliveryOption.findByPk(item.deliveryOptionId);
    if (!deliveryOption) {
      return res.status(400).json({ error: `Invalid delivery option: ${item.deliveryOptionId}` });
    }

    const productCost = product.priceCents * item.quantity;
    const shippingCost = deliveryOption.priceCents;
    totalCostCents += productCost + shippingCost;

    products.push({
      productId: item.productId,
      quantity: item.quantity,
      estimatedDeliveryTimeMs: Date.now() + deliveryOption.deliveryDays * 24 * 60 * 60 * 1000
    });
  }

  totalCostCents = Math.round(totalCostCents * 1.1);

  const order = await Order.create({
    userId: req.user.id,
    orderTimeMs: Date.now(),
    totalCostCents,
    products
  });

  await CartItem.destroy({ where: { userId: req.user.id } });

  res.status(201).json(order);
});

router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const expand = req.query.expand;

  // Only find the order if it belongs to the logged-in user.
  let order = await Order.findOne({ where: { id: orderId, userId: req.user.id } });
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (expand === 'products') {
    const products = await Promise.all(order.products.map(async (product) => {
      const productDetails = await Product.findByPk(product.productId);
      return {
        ...product,
        product: productDetails
      };
    }));
    order = {
      ...order.toJSON(),
      products
    };
  }

  res.json(order);
});

export default router;