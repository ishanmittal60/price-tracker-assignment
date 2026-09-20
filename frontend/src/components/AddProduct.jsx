import { useState, useEffect } from 'react';
import { api } from '../api/client';
import axios from 'axios';

export default function AddProduct({ onProductAdded, onAdd }) {
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch full catalog from the mock store once on load
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await axios.get((import.meta.env.VITE_API_BASE_URL || '') + '/api/catalog');
        // Safely extract the array whether it is a direct array or nested inside an object
        const data = Array.isArray(response.data) ? response.data : (response.data.items || response.data.data || []);
        setCatalog(data);
      } catch (error) {
        console.error('Error fetching catalog. It may be blocked by CORS:', error);
      }
    };
    fetchCatalog();
  }, []);

  // Filter local catalog when user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Fallback: If user pastes a full URL, bypass the catalog search and let them track the URL directly
    // Look up the real item in catalog if a URL is pasted
    if (query.includes('demo.inelabteamdev.com/product/')) {
      const productId = query.split('/product/')[1]?.replace(/\D/g, '');
      const matchedItem = catalog.find((p) => String(p.id) === String(productId));

      if (matchedItem) {
        setResults([matchedItem]);
      } else {
        setResults([{ id: productId || 'manual', isManualUrl: true, url: query, name: `Product #${productId}` }]);
      }
      return;
    }
    const lowerCaseQuery = query.toLowerCase();
    const filtered = catalog.filter((item) => {
      // Safely check properties with optional chaining (?.) to prevent crashes if a property is missing
      const nameMatch = item.name?.toLowerCase().includes(lowerCaseQuery);
      const titleMatch = item.title?.toLowerCase().includes(lowerCaseQuery);
      const brandMatch = item.brand?.toLowerCase().includes(lowerCaseQuery);

      return nameMatch || titleMatch || brandMatch;
    });

    setResults(filtered.slice(0, 5)); // Show top 5 matches
  }, [query, catalog]);

  // Save selected product to the database
  const handleTrackProduct = async (item) => {
    setLoading(true);
    try {
      const payload = item.isManualUrl ? {
        product_name: "Tracked Product",
        product_url: item.url,
        sku: "N/A",
        category: "Custom",
        brand: "Unknown"
      } : {
        // Fallback to title if name is missing
        product_name: item.name || item.title || 'Unknown Product',
        product_url: `https://demo.inelabteamdev.com/product/${item.id}`,
        sku: item.sku || 'N/A',
        category: item.category || 'N/A',
        brand: item.brand || 'N/A'
      };

      await api.addProduct(payload);
      setQuery('');
      if (onProductAdded) onProductAdded();
      if (onAdd) onAdd(); // Refresh dashboard list
    } catch (error) {
      console.error('Error tracking product:', error);
      alert('Failed to track product. Check backend console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 mb-8 relative">
      <h2 className="text-xl font-bold text-white mb-1">Track New Product</h2>
      <p className="text-slate-400 text-sm mb-4">Search the catalog or paste a product URL directly</p>

      <input
        type="text"
        className="input-field w-full"
        placeholder="Search by name, brand, or paste a URL..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query && (
        <div className="absolute z-50 w-full left-0 mt-2 bg-dark-800 border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="py-2">
              {results.map((item) => (
                <li key={item.id} className="px-4 py-3 hover:bg-dark-700 flex justify-between items-center transition-colors border-b border-slate-700/50 last:border-0">
                  <div>
                    <p className="text-white font-medium">{item.name || item.title || 'Unknown'}</p>
                    {!item.isManualUrl && (
                      <p className="text-xs text-slate-400">{item.category} · SKU: {item.sku}</p>
                    )}
                    {item.isManualUrl && (
                      <p className="text-xs text-slate-400 text-brand-400">{item.url}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleTrackProduct(item)}
                    disabled={loading}
                    className="btn-primary py-1 px-3 text-sm"
                  >
                    Track
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-slate-400">
              No products found matching "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}