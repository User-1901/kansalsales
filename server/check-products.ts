/**
 * Check product count
 */
import 'dotenv/config';
import { pool } from './src/db.js';

async function checkProducts() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM products');
    const count = (result.rows[0] as any).count;
    console.log(`Products in database: ${count}`);
    
    if (count > 0) {
      const products = await pool.query('SELECT id, name, price FROM products LIMIT 5');
      products.rows.forEach((p: any) => {
        console.log(`  - ${p.name}: ₹${p.price}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProducts();
