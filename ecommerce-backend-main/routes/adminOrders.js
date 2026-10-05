import express from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Profile } from '../models/Profile.js';
import { OrderMessage } from '../models/OrderMessage.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Every route in this file is admin-only so we need to be logged as an admin.
router.use(requireAuth, requireAdmin);

// List ALL orders (newest first), with the customer's email and product details.
/*

Loads every order we don't only need the plain order so the page gets more info like
the userId, so we also get the profile with the user id

Then the same with the products we get more info of them instead that just the id

Then reads the messages in order, and who wrote.

*/ 
router.get('/', async (req, res) => {
  const orders = await Order.unscoped().findAll({ order: [['orderTimeMs', 'DESC']] });

  const userIds = [...new Set(orders.map((order) => order.userId).filter(Boolean))];
  const profiles = await Profile.findAll({ where: { id: userIds } });
  const emailById = new Map(profiles.map((profile) => [profile.id, profile.email]));

  const productIds = [...new Set(orders.flatMap((order) => order.products.map((line) => line.productId)))];
  const products = await Product.findAll({ where: { id: productIds } });
  const productById = new Map(products.map((product) => [product.id, product]));

  // How many messages each order has, and who wrote the last one
  const messages = await OrderMessage.findAll({
    where: { orderId: orders.map((order) => order.id) },
    attributes: ['orderId', 'senderRole', 'createdAt'],
    order: [['createdAt', 'ASC']]
  });
  const messageStats = new Map();
  for (const message of messages) {
    const previous = messageStats.get(message.orderId);
    messageStats.set(message.orderId, {
      count: (previous?.count ?? 0) + 1,
      lastFrom: message.senderRole
    });
  }

  const result = orders.map((order) => ({
    ...order.toJSON(),
    messageCount: messageStats.get(order.id)?.count ?? 0,
    lastMessageFrom: messageStats.get(order.id)?.lastFrom ?? null, // 'customer' = waiting for a reply
    userEmail: emailById.get(order.userId) ?? null, // null = old order with no user
    products: order.products.map((line) => ({
      ...line,
      product: productById.get(line.productId) ?? null // null = product was deleted
    }))
  }));

  res.json(result);
});

// Modify an order: the total, and each line's quantity / delivery date.
// Lines can be removed by leaving them out, but new products cannot be added.
router.put('/:orderId', async (req, res) => {
  const order = await Order.findByPk(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { totalCostCents, products } = req.body;

  if (totalCostCents !== undefined) {
    if (!Number.isInteger(totalCostCents) || totalCostCents < 0) {
      return res.status(400).json({ error: 'totalCostCents must be a whole number, 0 or more' });
    }
    order.totalCostCents = totalCostCents;
  }

  if (products !== undefined) {
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'An order needs at least one product. Delete the order instead.' });
    }

    const existingIds = new Set(order.products.map((line) => line.productId));
    const seen = new Set();
    const updatedLines = [];

    for (const line of products) {
      if (!existingIds.has(line.productId) || seen.has(line.productId)) {
        return res.status(400).json({ error: 'Invalid product in order' });
      }
      if (!Number.isInteger(line.quantity) || line.quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be a whole number, 1 or more' });
      }
      if (!Number.isFinite(line.estimatedDeliveryTimeMs)) {
        return res.status(400).json({ error: 'Invalid delivery date' });
      }

      seen.add(line.productId);
      updatedLines.push({
        productId: line.productId,
        quantity: line.quantity,
        estimatedDeliveryTimeMs: line.estimatedDeliveryTimeMs
      });
    }

    order.products = updatedLines;
  }

  await order.save();
  res.json(order);
});

// Delete an order completely. If the chat has no order it deletes
router.delete('/:orderId', async (req, res) => {
  const order = await Order.findByPk(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // The chat belongs to the order, so it goes away with it.
  await OrderMessage.destroy({ where: { orderId: order.id } });
  await order.destroy();
  res.status(204).send();
});

export default router;
