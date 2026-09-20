import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Tag, ChevronRight, Activity } from 'lucide-react';

const ProductList = ({ products, onScrape }) => {
  const [scrapingUrls, setScrapingUrls] = useState(new Set());

  if (!products || products.length === 0) {
    return (
      <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
        <div className="bg-dark-800 p-4 rounded-full mb-4">
          <Tag className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">No products tracked yet</h3>
        <p className="text-slate-400 max-w-md">Add your first product above to start monitoring price drops and stock changes automatically.</p>
      </div>
    );
  }

  const handleScrape = async (id, url) => {
    setScrapingUrls(prev => new Set(prev).add(id));
    await onScrape({ id, url });
    setScrapingUrls(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        const isScraping = scrapingUrls.has(product.id);
        
        return (
          <div key={product.id} className="glass-card group hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col h-full">
            <div className="p-5 flex-grow">
              <div className="flex justify-between items-start mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-dark-700 text-slate-300 border border-slate-600">
                  {product.brand || 'No Brand'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-dark-700 text-slate-300 border border-slate-600">
                  {product.category || 'Uncategorized'}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-brand-400 transition-colors">
                <Link to={`/product/${product.id}`}>
                  {product.product_name}
                </Link>
              </h3>
              
              <a 
                href={product.product_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center text-xs text-brand-400/80 hover:text-brand-400 truncate w-full mb-4 group/link"
              >
                <ExternalLink className="w-3 h-3 mr-1 shrink-0 group-hover/link:animate-pulse" />
                <span className="truncate">{product.product_url}</span>
              </a>
            </div>
            
            <div className="p-5 pt-0 mt-auto border-t border-glass-border/50 flex items-center justify-between gap-3">
              <button
                onClick={() => handleScrape(product.id, product.product_url)}
                disabled={isScraping}
                className="flex-1 btn-secondary text-xs flex justify-center items-center py-2 px-3"
              >
                {isScraping ? (
                  <>
                    <Activity className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
                    Force Scrape
                  </>
                )}
              </button>
              <Link
                to={`/product/${product.id}`}
                className="flex-1 btn-primary text-xs flex justify-center items-center py-2 px-3"
              >
                Details
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductList;
