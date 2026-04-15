/**
 * Test product query
 */
import 'dotenv/config';
import { pool } from './src/db.js';

async function testQuery() {
  try {
    const productId = 'd63fde0a-cdb4-46e3-8265-219b303b792b';
    console.log(`Querying for product ID: ${productId}`);
    
    const result = await pool.query(
      `SELECT id, name, description, price::text, stock_status, category_id, image_urls, quantity_available, why_shop_message, created_at, updated_at
       FROM products WHERE id = $1`,
      [productId]
    );
    
    console.log(`rowCount: ${result.rowCount}`);
    console.log(`rows: ${JSON.stringify(result.rows, null, 2)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testQuery();
