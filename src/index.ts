import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = Number(process.env.PORT) || 8000;

// If run directly via node/tsx
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  console.log(`Server is running on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

// Export default app for Vercel Edge / Serverless functions
export default app;
