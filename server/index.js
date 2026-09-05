import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './src/config/db.js';
import models from './src/models/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Odoo Clone API Server is running',
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

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  await testConnection();
});

export default app;
