import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import playersRoutes from './routes/players.routes';
import teamsRoutes from './routes/teams.routes';
import tournamentsRoutes from './routes/tournaments.routes';
import matchesRoutes from './routes/matches.routes';
import scoringRoutes from './routes/scoring.routes';
import overlayRoutes from './routes/overlay.routes';
import analyticsRoutes from './routes/analytics.routes';
import matchRulesRoutes from './routes/matchRules.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/tournaments', tournamentsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/overlay', overlayRoutes);  // For OBS and live streaming
app.use('/api/analytics', analyticsRoutes);  // For graphs and analytics
app.use('/api/match-rules', matchRulesRoutes);  // For match rules configuration

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join match room
  socket.on('join-match', (matchId) => {
    socket.join(`match-${matchId}`);
    console.log(`Client ${socket.id} joined match ${matchId}`);
  });

  // Leave match room
  socket.on('leave-match', (matchId) => {
    socket.leave(`match-${matchId}`);
    console.log(`Client ${socket.id} left match ${matchId}`);
  });

  // Ball scored event
  socket.on('ball-scored', (data) => {
    io.to(`match-${data.matchId}`).emit('match-update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log(`🏏 Cricket Scoring API ready!`);
});

export { io };
