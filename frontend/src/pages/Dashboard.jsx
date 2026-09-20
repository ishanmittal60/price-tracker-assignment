import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import ProductList from '../components/ProductList';
import AddProduct from '../components/AddProduct';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProducts = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      else setLoading(true);
      
      const response = await api.getProducts();
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please check if the backend server is running.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (productData) => {
    try {
      await api.addProduct(productData);
      fetchProducts(); 
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Failed to add product');
    }
  };

  const handleManualScrape = async ({ id, url }) => {
    try {
      await api.triggerManualScrape(id, url);
      fetchProducts();
    } catch (err) {
      console.error('Error triggering scrape:', err);
      alert('Scrape failed. Check logs for details.');
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-slate-400 mt-1">Manage and track your products in real-time.</p>
        </div>
        <button 
          onClick={() => fetchProducts(true)}
          disabled={isRefreshing}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>
      
      <AddProduct onAdd={handleAddProduct} />
      
      {error && (
        <div className="glass-panel border-red-500/50 bg-red-500/10 p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
          <p className="text-slate-400 animate-pulse">Loading tracked products...</p>
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Tracked Products</h2>
            <span className="bg-brand-500/20 text-brand-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-brand-500/30">
              {products.length} {products.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>
          <ProductList products={products} onScrape={handleManualScrape} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
