import { PORT } from './config/env';
import app from './app';

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Backend listening at http://localhost:${PORT} (Supabase mode)`);
  });
};

startServer();
