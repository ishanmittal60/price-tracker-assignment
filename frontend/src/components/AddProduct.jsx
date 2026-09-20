import { useState, useEffect } from 'react';
import client, { api } from '../api/client';

export default function AddProduct({ onProductAdded, onAdd }) {
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch full catalog from your backend proxy on load
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await client.get('/catalog');
        console.log("Fetched catalog data:", response.data); // Check your browser console to see the structure

        // Safely extract the array from different possible response formats
        const data = Array.isArray(response.data)
          ? response.data
          : (response.data.items || response.data.data || response.data.products || []);

        setCatalog(data);
      } catch (error) {
        console.error('Error fetching catalog:', error);
      }
    };
    fetchCatalog();
  }, []);

  // Filter catalog when user types a name or brand
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // If user pasted a direct product URL, handle it as a manual entry
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
      // Check multiple common field names for product names
      const name = item.name || item.title || item.product_name || '';
      const brand = item.brand || '';
      const category = item.category || '';

      return (
        name.toLowerCase().includes(lowerCaseQuery) ||
        brand.toLowerCase().includes(lowerCaseQuery) ||
        category.toLowerCase().includes(lowerCaseQuery)
      );
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
        product_name: item.name || item.title || item.product_name || 'Unknown Product',
        product_url: `https://demo.inelabteamdev.com/product/${item.id}`,
        sku: item.sku || 'N/A',
        category: item.category || 'N/A',
        brand: item.brand || 'N/A'
      };

      await api.addProduct(payload);
      setQuery('');
      setResults([]);
      if (onProductAdded) onProductAdded();
      if (onAdd) onAdd(); // Refresh dashboard list
    } catch (error) {
      console.error('Error tracking product:', error);
      alert('Failed to track product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 mb-8 relative">
      <h2 className="text-xl font-bold text-white mb-1">Track New Product</h2>
      <p className="text-slate-400 text-sm mb-4">Search products by name or paste a direct URL</p>

      <input
        type="text"
        className="input-field w-full"
        placeholder="Type a product name (e.g. Ironwood, Watch) or paste URL..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query && results.length > 0 && (
        <div className="absolute z-50 w-full left-0 mt-2 bg-dark-800 border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
          <ul className="py-2">
            {results.map((item) => {
              const displayName = item.name || item.title || item.product_name || 'Unknown Product';
              return (
                <li key={item.id || Math.random()} className="px-4 py-3 hover:bg-dark-700 flex justify-between items-center transition-colors border-b border-slate-700/50 last:border-0">
                  <div>
                    <p className="text-white font-medium">{displayName}</p>
                    <p className="text-xs text-slate-400">{item.category || 'General'} · SKU: {item.sku || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => handleTrackProduct(item)}
                    disabled={loading}
                    className="btn-primary py-1 px-3 text-sm"
                  >
                    Track
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {query && results.length === 0 && (
        <div className="absolute z-50 w-full left-0 mt-2 bg-dark-800 border border-slate-700 rounded-lg shadow-2xl p-4 text-center text-slate-400">
          No matching products found in catalog. (You can still paste the full URL to track it!)
        </div>
      )}
    </div>
  );
}