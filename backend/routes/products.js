import express from 'express';
import { getAllProducts, addProduct, getProductHistory, getProductLogs } from '../db.js';

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const { product_name, name, product_url, url, brand, category, sku } = req.body;
    
    const finalName = product_name || name;
    const finalUrl = product_url || url;

    const { supabase } = await import('../supabase.js');

    let { data: newProduct, error } = await supabase
      .from('products')
      .insert([{
        product_name: finalName,
        product_url: finalUrl,
        brand,
        category,
        sku
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        const { data: existingProduct, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('product_url', finalUrl)
          .single();
          
        if (fetchError) {
          console.error('Error fetching existing product:', fetchError);
          return res.status(500).json({ error: fetchError.message });
        }
        return res.status(200).json(existingProduct);
      }
      console.error('Supabase Insert Error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Server error adding product:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { supabase } = await import('../supabase.js');
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id/history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { supabase } = await import('../supabase.js');
    const { data: product, error } = await supabase.from('products').select('product_url').eq('id', id).single();
    if (error) throw error;
    
    const history = await getProductHistory(product.product_url);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id/logs
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { supabase } = await import('../supabase.js');
    const { data: product, error } = await supabase.from('products').select('product_url').eq('id', id).single();
    if (error) throw error;
    
    const logs = await getProductLogs(product.product_url);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
