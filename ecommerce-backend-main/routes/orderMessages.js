import express from 'express';
import { Order } from '../models/Order.js';
import { OrderMessage } from '../models/OrderMessage.js';
import { requireAuth } from '../middleware/auth.js';
/*  This is basically the part of the thing that handles the chat.
Everytime a message is send and ever time we load the convo

This file what do si read all the message of an order with get
and sends a new message with post




*/
// mergeParams lets us read :orderId from the path this router is mounted on
const router = express.Router({ mergeParams: true });

router.use(requireAuth);

// Loads the order and checks the user may use its chat:
// the customer who owns the order, or any admin.
router.use(async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId);
    const allowed = order && (order.userId === req.user.id || req.user.role === 'admin');

    if (!allowed) {
      // Same answer for "doesn't exist" and "not yours", so ids can't be guessed.
      return res.status(404).json({ error: 'Order not found' });
    }

    req.order = order;
    next();
  } catch (err) {
    next(err);
  }
});

// All messages of the order, oldest first.
router.get('/', async (req, res, next) => {
  try {
    const messages = await OrderMessage.findAll({
      where: { orderId: req.order.id },
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// Send a message.
router.post('/', async (req, res, next) => {
  try {
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';

    if (!text) {
      return res.status(400).json({ error: 'Write a message first' });
    }
    if (text.length > 1000) {
      return res.status(400).json({ error: 'Messages can be at most 1000 characters' });
    }

    const message = await OrderMessage.create({
      orderId: req.order.id,
      senderId: req.user.id,
      senderRole: req.user.role === 'admin' ? 'admin' : 'customer',
      text
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

export default router;
