import axios from 'axios';

// Create an Axios instance with base URL for the backend API
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://price-tracker-assignment.onrender.com/api',
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
