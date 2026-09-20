import axios from 'axios';

// Create an Axios instance with base URL for the backend API
// We now rely on Vite's proxy for /api, so the base URL is simply /api
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getProducts: () => client.get('/products'),
  getProduct: (id) => client.get(`/products/${id}`),
  addProduct: (product) => client.post('/products', product),
  getProductHistory: (id) => client.get(`/products/${id}/history`),
  getProductLogs: (id) => client.get(`/products/${id}/logs`),
  triggerManualScrape: (id, url) => client.post('/scrape/manual', { id, url }),
};

export default client;
