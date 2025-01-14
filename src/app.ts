import express from 'express';
import cors from 'cors';
import { config } from '@/config';
import { connectDB } from '@/config/database';
import * as authRoutes from '@/routes/auth';
import * as publicRoutes from '@/routes/public';
import * as protectedRoutes from '@/routes/protected';

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes.router);
app.use('/api/public', publicRoutes.router);
app.use('/api/protected', protectedRoutes.router);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});