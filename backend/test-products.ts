import 'dotenv/config';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../pgdata');

const db = new PGlite(dbPath);
await db.waitReady;

const result = await db.query('SELECT id, name, price FROM products LIMIT 5');
console.log('Products found:', result.rows.length);
result.rows.forEach((row: any) => {
  console.log(`- ${row.name} (${row.id}): ₹${row.price}`);
});

await db.close();
