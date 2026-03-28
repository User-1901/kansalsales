import 'dotenv/config';
import { dbReady } from './db.js';
import app from './app.js';

const PORT = process.env.PORT ?? 3000;

// Wait for DB init to complete before accepting requests
dbReady.then(() => {
  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
  });
});
