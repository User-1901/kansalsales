/**
 * Run this once to create/update the admin account:
 *   npm run seed:admin   (from server/ directory)
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../pgdata');

const db = new PGlite(dbPath);
await db.waitReady;

const email = 'rajuadmin@kansalsales.com';
const plainPassword = 'Raj@1234';
const hash = await bcrypt.hash(plainPassword, 10);

await db.query(
  `INSERT INTO users (email, display_name, password_hash, role, email_verified)
   VALUES ($1, $2, $3, 'admin', TRUE)
   ON CONFLICT (email) DO UPDATE
     SET password_hash  = EXCLUDED.password_hash,
         role           = 'admin',
         email_verified = TRUE`,
  [email, 'Raju Admin', hash],
);

console.log('✅ Admin upserted successfully');
console.log(`   Email:    ${email}`);
console.log(`   Password: ${plainPassword}`);

await db.close();
process.exit(0);
