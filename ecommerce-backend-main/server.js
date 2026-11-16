import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import path from 'path';
import meRoutes from './routes/me.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { sequelize } from './models/index.js';
import productRoutes from './routes/products.js';
import deliveryOptionRoutes from './routes/deliveryOptions.js';
import cartItemRoutes from './routes/cartItems.js';
import orderRoutes from './routes/orders.js';
import paymentSummaryRoutes from './routes/paymentSummary.js';
import { Product } from './models/Product.js';
import { DeliveryOption } from './models/DeliveryOption.js';
import { CartItem } from './models/CartItem.js';
import { Order } from './models/Order.js';
import { defaultProducts } from './defaultData/defaultProducts.js';
import { defaultDeliveryOptions } from './defaultData/defaultDeliveryOptions.js';
import { defaultCart } from './defaultData/defaultCart.js';
import { defaultOrders } from './defaultData/defaultOrders.js';
import fs from 'fs';
import adminOrderRoutes from './routes/adminOrders.js';
import orderMessageRoutes from './routes/orderMessages.js';
  

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Behind the AWS load balancer every visitor would look like the same address,
// so we tell Express to trust the first proxy. Without this the rate limit
// below would count everybody together.
app.set('trust proxy', 1);

//Use helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        //This line is important is the lines in which helps where the page may send requests, it's now pointing at supabase
        'connect-src': ["'self'", process.env.SUPABASE_URL],
        // Product images are stored in Supabase Storage
        'img-src': ["'self'", 'data:', 'https://*.supabase.co'],
        // The Cloudflare Turnstile captcha loads a script and shows an iframe
        'script-src': ["'self'", 'https://challenges.cloudflare.com'],
        'frame-src': ["'self'", 'https://challenges.cloudflare.com'],
        'upgrade-insecure-requests': null,
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);


// Middleware
// Only these websites may call the API from a browser.
// In production set ALLOWED_ORIGINS=https://your-domain.com (separate several with commas)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

app.use(cors({
  origin: (origin, callback) => {
    // No origin = same-site requests and tools like Postman
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

// Rate limits: how many requests one visitor can make in 15 minutes
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Stricter for checkout
app.use('/api/orders', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Serve images from the images folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/delivery-options', deliveryOptionRoutes);
app.use('/api/cart-items', cartItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment-summary', paymentSummaryRoutes);
app.use('/api/me', meRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/orders/:orderId/messages', orderMessageRoutes);

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve index.html for any unmatched routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

// Error handling middleware
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
/* eslint-enable no-unused-vars */

// Sync database and load default data if none exist
// alter: true changes the tables to match the models, which is handy while
// developing but risky on a live database, so in production we only create
// missing tables. Set NODE_ENV=production on the server.
await sequelize.sync(process.env.NODE_ENV === 'production' ? {} : { alter: true });

const productCount = await Product.count();
if (productCount === 0) {
  const timestamp = Date.now();

  const productsWithTimestamps = defaultProducts.map((product, index) => ({
    ...product,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  const deliveryOptionsWithTimestamps = defaultDeliveryOptions.map((option, index) => ({
    ...option,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  const cartItemsWithTimestamps = defaultCart.map((item, index) => ({
    ...item,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  const ordersWithTimestamps = defaultOrders.map((order, index) => ({
    ...order,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  await Product.bulkCreate(productsWithTimestamps);
  await DeliveryOption.bulkCreate(deliveryOptionsWithTimestamps);
  await CartItem.bulkCreate(cartItemsWithTimestamps);
  await Order.bulkCreate(ordersWithTimestamps);

  console.log('Default data added to the database.');
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});