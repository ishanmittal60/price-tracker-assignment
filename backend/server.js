import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import productsRoutes from './routes/products.js';
import scrapeRoutes from './routes/scrape.js';

dotenv.config();

// 1. Initialize app FIRST before using it
const app = express();
const PORT = process.env.PORT || 5000;

// 2. Middlewares
app.use(cors());
app.use(express.json());

// 3. Mount routes
app.use('/api/products', productsRoutes);
app.use('/api/scrape', scrapeRoutes);

// Catalog proxy
app.get('/api/catalog', async (req, res) => {
  try {
    const response = await axios.get('https://demo.inelabteamdev.com/api/catalog?page=1&pageSize=100');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching catalog proxy:', error.message);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 4. Start listener
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});