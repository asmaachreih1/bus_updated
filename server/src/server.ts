import { PORT } from './config/env';
import app from './app';
import { connectDB } from './config/db';

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Backend listening at http://localhost:${PORT}`);
  });
};

startServer();
