-- Supabase Database Schema Initialization

-- 1. products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_url TEXT UNIQUE NOT NULL,
  brand TEXT,
  category TEXT,
  sku TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. price_history table
CREATE TABLE price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC,
  stock_status TEXT,
  stock_quantity INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. scrape_logs table
CREATE TYPE scrape_status AS ENUM ('success', 'retried', 'failed');

CREATE TABLE scrape_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  status scrape_status NOT NULL,
  error_message TEXT,
  attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
