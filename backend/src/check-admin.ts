import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new PGlite(path.resolve(__dirname, '../../pgdata'));
await db.waitReady;

const r = await db.query("SELECT id, email, display_name, role, password_hash FROM users WHERE role = 'admin'");
console.log('Admin users found:', r.rows.length);
for (const row of r.rows as any[]) {
  console.log('  email:', row.email, '| display_name:', row.display_name);
  const match = await bcrypt.compare('Raj@1234', row.password_hash);
  console.log('  password Raj@1234 matches:', match);
}

await db.close();
process.exit(0);
