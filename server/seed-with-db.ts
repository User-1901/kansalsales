/**
 * Seed products using the same db connection as the server
 * Run from server directory: npx tsx seed-with-db.ts
 */
import 'dotenv/config';
import { pool } from './src/db.js';

async function seedProducts() {
  try {
    // Get or create categories
    const categoryResults = await pool.query(`
      INSERT INTO categories (name) VALUES 
        ('Dairy'),
        ('Vegetables'),
        ('Fruits')
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `);

    const catMap: Record<string, string> = {};
    for (const row of categoryResults.rows) {
      catMap[(row as any).name] = (row as any).id;
    }

    // Define products
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

    // Insert products
    for (const prod of products) {
      await pool.query(
        `INSERT INTO products (name, description, price, stock_status, category_id, image_urls, quantity_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [prod.name, prod.description, prod.price, prod.stock_status, prod.category_id, prod.image_urls, prod.quantity_available],
      );
    }

    console.log('✅ Products seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedProducts();
