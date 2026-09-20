import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import PriceChart from '../components/PriceChart';
import ScrapeLogs from '../components/ScrapeLogs';
import { ArrowLeft, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [productRes, historyRes, logsRes] = await Promise.all([
        api.getProduct(id),
        api.getProductHistory(id),
        api.getProductLogs(id)
      ]);
      setProduct(productRes.data);
      setHistory(historyRes.data);
      setLogs(logsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  if (loading || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
        <p className="text-slate-400 animate-pulse text-lg">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <Link to="/" className="inline-flex items-center text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        
        <div className="glass-card p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-grow">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2" title={product.product_name}>
                  {product.product_name} Analytics
                </h1>
                <p className="text-sm text-slate-400 mb-6 break-all max-w-3xl">
                  {product.product_url}
                </p>
              </div>
              <a 
                href={product.product_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center whitespace-nowrap shrink-0"
              >
                View on Store
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-panel border-red-500/50 bg-red-500/10 p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <section className="xl:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">Price History</h2>
          <PriceChart data={history} />
        </section>

        <section className="xl:col-span-1">
          <h2 className="text-xl font-semibold text-white mb-4">Activity Logs</h2>
          <ScrapeLogs logs={logs} />
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;
