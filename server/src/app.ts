import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import busRoutes from './routes/bus.routes';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// Preferred API prefixes
app.use('/api/auth', authRoutes);
app.use('/api/bus', busRoutes);

// Backward-compatible API prefixes used by the current frontend
app.use('/api', authRoutes);
app.use('/api', busRoutes);

app.get('/', (req, res) => {
  res.send('Tracker Backend is Running...');
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
