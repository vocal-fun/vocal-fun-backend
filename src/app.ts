import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import { connectDB } from './config/database';
import * as authRoutes from './routes/auth';
import * as agentRountes from './routes/agents';
import * as callRoutes from './routes/call';
import * as userRoutes from './routes/user';
import * as vocalRoutes from './routes/vocal';
import { setupSocket } from './socket';
import { vocalCreditListener } from './services/vocalService';

const app = express();

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  },
});

try {
  setupSocket(io);
} catch (e) {
  console.log(e)
}

// Middleware
// app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes.router);
app.use('/api/v1/agents', agentRountes.router);
app.use('/api/v1/user', userRoutes.router);
app.use('/api/v1/call', callRoutes.router);
app.use('/api/v1/vocal', vocalRoutes.router);

vocalCreditListener();

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// Start the server
server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
