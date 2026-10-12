import express from 'express';
import { Order } from '../models/Order.js';
import { sequelize } from '../models/index.js';
import { Product } from '../models/Product.js';
import { DeliveryOption } from '../models/DeliveryOption.js';
import { CartItem } from '../models/CartItem.js';
import { requireAuth } from '../middleware/auth.js';
import { chargeTestCard, PAYMENT_SCENARIOS } from '../services/mockPayment.js';


const router = express.Router();

/*
Cheese user
*/
/*
Every cart need to have a logged user
every route now requires a logged user, so each
user can change their own cart and orders.
If a user trys to add an sold out product it won't work

*/
router.use(requireAuth);



// An error we throw on purpose when checkout cannot continue (empty cart, sold out...).
class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

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

router.post('/', async (req, res, next) => {
  try {
    // Everything inside the transaction happens "all or nothing":
    // if any step throws, the database goes back to how it was before.
    const order = await sequelize.transaction(async (transaction) => {
      const cartItems = await CartItem.findAll({
        where: { userId: req.user.id },
        transaction
      });

      if (cartItems.length === 0) {
        throw new CheckoutError('Cart is empty');
      }

      let totalCostCents = 0;
      const products = [];

      for (const item of cartItems) {
        // lock = nobody else can change this product's row until we finish.
        // This stops two people from buying the last unit at the same time.
        const product = await Product.findByPk(item.productId, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (!product) {
          throw new CheckoutError(`Product not found: ${item.productId}`);
        }

        if (product.stock < item.quantity) {
          throw new CheckoutError(
            product.stock === 0
              ? `Sold out: ${product.name}`
              : `Only ${product.stock} left of ${product.name}`,
            409
          );
        }

        const deliveryOption = await DeliveryOption.findByPk(item.deliveryOptionId, { transaction });
        if (!deliveryOption) {
          throw new CheckoutError(`Invalid delivery option: ${item.deliveryOptionId}`);
        }

        totalCostCents += product.priceCents * item.quantity + deliveryOption.priceCents;

        // Take the units out of the stock
        product.stock -= item.quantity;
        await product.save({ transaction });

        products.push({
          productId: item.productId,
          quantity: item.quantity,
          estimatedDeliveryTimeMs: Date.now() + deliveryOption.deliveryDays * 24 * 60 * 60 * 1000
        });
      }

      totalCostCents = Math.round(totalCostCents * 1.1);

      const newOrder = await Order.create({
        userId: req.user.id,
        orderTimeMs: Date.now(),
        totalCostCents,
        products
      }, { transaction });

      await CartItem.destroy({ where: { userId: req.user.id }, transaction });

      return newOrder;
    });

    res.status(201).json(order);
  } catch (err) {
    if (err instanceof CheckoutError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
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