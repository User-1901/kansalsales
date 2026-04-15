/**
 * List all product IDs to debug
 */
import 'dotenv/config';
import { pool } from './src/db.js';

async function listProductIds() {
  try {
    const result = await pool.query('SELECT id, name FROM products LIMIT 10');
    console.log('Products in database:');
    result.rows.forEach((p: any) => {
      console.log(`  ID: ${p.id}`);
      console.log(`  Name: ${p.name}`);
      console.log('');
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listProductIds();
