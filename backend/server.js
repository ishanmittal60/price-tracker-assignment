import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import productsRoutes from './routes/products.js';
import scrapeRoutes from './routes/scrape.js';
import cronRoutes from './routes/cron.js';

// Register route
app.use('/api/cron', cronRoutes);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productsRoutes);
app.use('/api/scrape', scrapeRoutes);

app.get('/api/catalog', async (req, res) => {
  try {
    const response = await axios.get('https://demo.inelabteamdev.com/api/catalog?page=1&pageSize=100');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching catalog proxy:', error.message);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
