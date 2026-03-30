/**
 * Run this to seed sample products:
 *   npx tsx src/seed-products.ts   (from server/ directory)
 */
import 'dotenv/config';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../pgdata');

const db = new PGlite(dbPath);
await db.waitReady;

// First, ensure categories exist
const categories = [
  { id: randomUUID(), name: 'Dairy' },
  { id: randomUUID(), name: 'Vegetables' },
  { id: randomUUID(), name: 'Fruits' },
];

for (const cat of categories) {
  await db.query(
    `INSERT INTO categories (id, name) VALUES ($1, $2)
     ON CONFLICT (name) DO NOTHING`,
    [cat.id, cat.name],
  );
}

// Get category IDs
const catResult = await db.query('SELECT id, name FROM categories LIMIT 3');
const catMap = Object.fromEntries(catResult.rows.map(c => [c.name, c.id]));

// Sample products
const products = [
  {
    name: 'Amul Masti Pouch Curd',
    description: '400g Fresh Yogurt\n\nNo Added Sugar\nRich in Probiotics',
    price: 35,
    category_id: catMap['Dairy'],
    stock_status: 'in_stock',
    quantity_available: 50,
    image_urls: ['https://via.placeholder.com/400x400?text=Amul+Curd'],
  },
  {
    name: 'Amul Gold Milk',
    description: '1L Fresh Milk\n\nFull Cream\nPasturized',
    price: 65,
    category_id: catMap['Dairy'],
    stock_status: 'in_stock',
    quantity_available: 100,
    image_urls: ['https://via.placeholder.com/400x400?text=Amul+Milk'],
  },
  {
    name: 'Fresh Carrots',
    description: '1kg Local Carrots\n\nOrganic\nFarm Fresh',
    price: 45,
    category_id: catMap['Vegetables'],
    stock_status: 'in_stock',
    quantity_available: 75,
    image_urls: ['https://via.placeholder.com/400x400?text=Carrots'],
  },
  {
    name: 'Banana Bunch',
    description: '1kg Fresh Bananas\n\nYellow and Ripe\nSweet Taste',
    price: 40,
    category_id: catMap['Fruits'],
    stock_status: 'in_stock',
    quantity_available: 60,
    image_urls: ['https://via.placeholder.com/400x400?text=Bananas'],
  },
];

for (const prod of products) {
  await db.query(
    `INSERT INTO products (name, description, price, stock_status, category_id, image_urls, quantity_available)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [prod.name, prod.description, prod.price, prod.stock_status, prod.category_id, prod.image_urls, prod.quantity_available],
  );
}

console.log('✅ Sample products created successfully');
console.log('   Added 4 sample products: Curd, Milk, Carrots, Bananas');

await db.close();
process.exit(0);
