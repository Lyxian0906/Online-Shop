// Uploads your local product images to Supabase Storage and saves the new
// public URL in each product's "image" field.
//
// Put this file in:  ecommerce-backend-main/scripts/uploadImages.js
// Run it from the backend folder:
//   node scripts/uploadImages.js
// or with your own images folder:
//   node scripts/uploadImages.js "C:\path\to\your\images"
//
// Safe to run twice: products whose image is already a URL are skipped.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { sequelize } from '../models/index.js';
import { Product } from '../models/Product.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Folder with your images (default: OnlineShop/Online-Shop/public/images/products)
const IMAGES_FOLDER = path.resolve(
  process.argv[2] || path.join(__dirname, '../images/products')
);

// The name of the PUBLIC bucket you created in Supabase -> Storage
const BUCKET = 'product-images';

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.log('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in the backend .env file');
  process.exit(1);
}

if (!fs.existsSync(IMAGES_FOLDER)) {
  console.log('Images folder not found:', IMAGES_FOLDER);
  console.log('Pass the folder when running: node scripts/uploadImages.js "C:\\path\\to\\images"');
  process.exit(1);
}

// "Elden Ring", "elden_ring" and "Elden-Ring" all become "eldenring",
// so a file still matches if it uses spaces, dashes or capital letters.
const simplify = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

// A clean file name for Supabase: "Elden Ring.PNG" -> "elden_ring.png"
const cleanName = (fileName) => {
  const { name, ext } = path.parse(fileName);
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + ext.toLowerCase();
};

// Read the folder once and index the image files by their simplified name
const files = fs
  .readdirSync(IMAGES_FOLDER)
  .filter((file) => MIME[path.extname(file).toLowerCase()]);

console.log(`Images folder: ${IMAGES_FOLDER}`);
console.log(`Image files found: ${files.length}\n`);

if (files.length === 0) {
  console.log('There are no images in that folder.');
  process.exit(1);
}

const fileBySimpleName = new Map();
for (const file of files) {
  const key = simplify(path.parse(file).name);
  if (!fileBySimpleName.has(key)) fileBySimpleName.set(key, file);
}

// The service key skips all the security rules, so it must stay in the
// backend. Never put it in the frontend and never commit it to GitHub.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const products = await Product.findAll();
const usedFiles = new Set();
const missing = [];
let uploaded = 0;
let failed = 0;

for (const product of products) {
  const current = product.image || '';

  if (current.startsWith('http')) {
    console.log('SKIP (already a URL)', product.name);
    continue;
  }

  // 1) the file name the product already points to, 2) the product name
  const fileName =
    fileBySimpleName.get(simplify(path.parse(current).name)) ||
    fileBySimpleName.get(simplify(product.name));

  if (!fileName) {
    missing.push(`${product.name} -> ${path.basename(current)}`);
    continue;
  }

  const storagePath = `products/${cleanName(fileName)}`;
  const contentType = MIME[path.extname(fileName).toLowerCase()];

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fs.readFileSync(path.join(IMAGES_FOLDER, fileName)), {
      contentType,
      upsert: true,
    });

  if (error) {
    console.log('FAIL', product.name, error.message);
    failed++;
    continue;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  product.image = data.publicUrl;
  await product.save();
  usedFiles.add(fileName);
  uploaded++;
  console.log('OK  ', product.name);
}

// Summary + a text file with everything that still needs an image
const unused = files.filter((file) => !usedFiles.has(file));
const reportPath = path.join(__dirname, 'missing-images.txt');
fs.writeFileSync(
  reportPath,
  `Products with no image file in your folder:\n${missing.join('\n')}\n\nFiles in your folder that matched no product:\n${unused.join('\n')}\n`
);

console.log(`\nUploaded: ${uploaded} | No image file: ${missing.length} | Failed: ${failed}`);
console.log(`Full list of missing images saved in: ${reportPath}`);

await sequelize.close();