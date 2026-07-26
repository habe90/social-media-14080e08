import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Express dev middleware plugin
function expressApiPlugin() {
  return {
    name: 'express-api-plugin',
    async configureServer(server) {
      const { default: express } = await import('express');
      const { default: expressRouter } = await import('./server/api.js');

      const app = express();
      app.use(express.json({ limit: '15mb' }));
      app.use('/api', expressRouter);
      server.middlewares.use(app);
    }
  };
}

export default defineConfig({
  plugins: [react(), expressApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
