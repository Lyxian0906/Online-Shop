import express from 'express';
import { Product } from '../models/Product.js';
import { CartItem } from '../models/CartItem.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_DESCRIPTION_LENGTH = 2000;

// Accepts ["a","b"] or "a,b" and returns a clean array (or null if invalid).
function cleanKeywords(keywords) {
  if (Array.isArray(keywords)) {
    return keywords.map(k => String(k).trim()).filter(Boolean);
  }
  if (typeof keywords === 'string') {
    return keywords.split(',').map(k => k.trim()).filter(Boolean);
  }
  return null;
}

// Public: anyone can browse products (sold-out ones included, with inStock: false).
router.get('/', async (req, res) => {
  const search = req.query.search;

  let products;
  if (search) {
    products = await Product.findAll();

    // Filter products by case-insensitive search on name or keywords
    const lowerCaseSearch = search.toLowerCase();

    products = products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(lowerCaseSearch);

      const keywordsMatch = product.keywords.some(keyword => keyword.toLowerCase().includes(lowerCaseSearch));

      return nameMatch || keywordsMatch;
    });

  } else {
    products = await Product.findAll();
  }

  res.json(products);
});

// Public: one product (used by the product page).
router.get('/:id', async (req, res) => {
  // A malformed id would make the database throw, so answer "not found" right away.
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const product = await Product.findByPk(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json(product);
});

// Admin: add a product
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { name, image, priceCents, keywords, rating, inStock, description } = req.body;

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (typeof image !== 'string' || !image.trim()) {
    return res.status(400).json({ error: 'Image is required' });
  }
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    return res.status(400).json({ error: 'priceCents must be a whole number, 0 or more' });
  }
  if (inStock !== undefined && typeof inStock !== 'boolean') {
    return res.status(400).json({ error: 'inStock must be true or false' });
  }
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ error: 'description must be text' });
  }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return res.status(400).json({ error: `Description can be at most ${MAX_DESCRIPTION_LENGTH} characters` });
  }

  const product = await Product.create({
    name: name.trim(),
    image: image.trim(),
    priceCents,
    keywords: cleanKeywords(keywords) ?? [],
    rating: rating ?? { stars: 0, count: 0 },
    inStock: inStock ?? true,
    description: (description ?? '').trim()
  });

  res.status(201).json(product);
});

// Admin: edit a product (name, image, price, keywords, rating, inStock, description)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { name, image, priceCents, keywords, rating, inStock, description } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name must be a non-empty string' });
    }
    product.name = name.trim();
  }

  if (image !== undefined) {
    if (typeof image !== 'string' || !image.trim()) {
      return res.status(400).json({ error: 'Image must be a non-empty string' });
    }
    product.image = image.trim();
  }

  if (priceCents !== undefined) {
    if (!Number.isInteger(priceCents) || priceCents < 0) {
      return res.status(400).json({ error: 'priceCents must be a whole number, 0 or more' });
    }
    product.priceCents = priceCents;
  }

  if (keywords !== undefined) {
    const cleaned = cleanKeywords(keywords);
    if (!cleaned) {
      return res.status(400).json({ error: 'keywords must be an array or a comma-separated string' });
    }
    product.keywords = cleaned;
  }

  if (rating !== undefined) {
    product.rating = rating;
  }

  if (inStock !== undefined) {
    if (typeof inStock !== 'boolean') {
      return res.status(400).json({ error: 'inStock must be true or false' });
    }
    product.inStock = inStock;
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      return res.status(400).json({ error: 'description must be text' });
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({ error: `Description can be at most ${MAX_DESCRIPTION_LENGTH} characters` });
    }
    product.description = description.trim();
  }

  await product.save();
  res.json(product);
});

// Admin: remove a product
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Carts reference products, so clear it from every cart first.
  await CartItem.destroy({ where: { productId: product.id } });
  await product.destroy();

  res.status(204).send();
});

export default router;