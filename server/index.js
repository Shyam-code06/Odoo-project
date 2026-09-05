import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { testConnection } from './src/config/db.js';
import { seedRbac } from './src/config/seedRbac.js';
import routes from './src/routes/index.js';
import { notFoundHandler, errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration (allow credentials for cookies)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or any localhost port
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token']
  })
);

app.use(express.json());
app.use(cookieParser());

// Base health check
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'PeoplePay360 HR & Payroll API Server is running',
    version: '1.0.0'
  });
});

app.get('/health', async (req, res) => {
  const isConnected = await testConnection();
  res.json({
    status: isConnected ? 'healthy' : 'database_unreachable',
    timestamp: new Date().toISOString()
  });
});

// Mount routes on both /api and root level for maximum compatibility
app.use('/api', routes);
app.use('/', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

const isMainModule = process.argv[1] && (process.argv[1].endsWith('index.js') || process.argv[1].endsWith('server.js'));

if (isMainModule && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    const connected = await testConnection();
    if (connected) {
      await seedRbac();
    }
  });
}

export default app;
