import { supabase } from './supabase.js';

// Placeholder for database operations.
// You can replace this with your existing working db.js logic.

export async function getAllProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) throw error;
  return data;
}

export async function addProduct(product) {
  // select() is crucial here so we get the returned `id` of the newly inserted product.
  const { data, error } = await supabase.from('products').insert([product]).select();
  if (error) throw error;
  return data;
}

export async function getProductHistory(productUrl) {
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('product_url', productUrl)
    .order('recorded_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getProductLogs(productUrl) {
  const { data, error } = await supabase
    .from('scrape_logs')
    .select('*')
    .eq('product_url', productUrl)
    .order('attempt_timestamp', { ascending: false });
  if (error) throw error;
  return data;
}

export async function logScrapeAttempt(logEntry) {
  const { error } = await supabase.from('scrape_logs').insert([logEntry]);
  if (error) console.error('Failed to log scrape attempt:', error);
}

export async function recordPriceHistory(historyEntry) {
  const { error } = await supabase.from('price_history').insert([historyEntry]);
  if (error) throw error;
}
