-- Run safely on both fresh and existing databases.
-- Uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS throughout.

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  main_category VARCHAR(50) NOT NULL,
  category_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS category_pricing_rules (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(255) UNIQUE NOT NULL,
  min_multiplier NUMERIC(6,2) NOT NULL,
  sweet_multiplier NUMERIC(6,2) NOT NULL,
  max_multiplier NUMERIC(6,2) NOT NULL,
  min_margin_pct NUMERIC(5,4) NOT NULL,
  target_margin_pct NUMERIC(5,4) NOT NULL,
  abs_price_floor NUMERIC(10,2),
  abs_price_ceiling NUMERIC(10,2),
  typical_return_rate NUMERIC(5,4) DEFAULT 0.12,
  weight_margin NUMERIC(4,3) DEFAULT 0.50,
  weight_conversion NUMERIC(4,3) DEFAULT 0.30,
  weight_profit_inr NUMERIC(4,3) DEFAULT 0.20,
  prefer_charm_pricing BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_fees (
  id SERIAL PRIMARY KEY,
  main_category VARCHAR(50),
  category_name VARCHAR(255),
  min_price NUMERIC(12,2) DEFAULT 0,
  max_price NUMERIC(12,2),
  rate NUMERIC(6,4)
);

CREATE TABLE IF NOT EXISTS closing_fees (
  id SERIAL PRIMARY KEY,
  min_price NUMERIC(12,2),
  max_price NUMERIC(12,2),
  easy_ship NUMERIC(8,2),
  self_ship NUMERIC(8,2),
  seller_flex NUMERIC(8,2)
);

CREATE TABLE IF NOT EXISTS shipping_costs (
  id SERIAL PRIMARY KEY,
  min_weight_kg NUMERIC(6,3),
  max_weight_kg NUMERIC(6,3),
  rate NUMERIC(8,2)
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sr_no INTEGER,
  product_name VARCHAR(255) NOT NULL,
  category_name VARCHAR(255) DEFAULT 'Handbags',
  weight_gm NUMERIC(8,2),
  length_cm NUMERIC(8,2),
  width_cm NUMERIC(8,2),
  height_cm NUMERIC(8,2),
  manufacturing_cost NUMERIC(10,2),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calculation_results (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  fulfillment_type VARCHAR(20) DEFAULT 'easy_ship',
  best_listing_price NUMERIC(10,2),
  best_selling_price NUMERIC(10,2),
  seller_side_costs NUMERIC(10,2),
  fulfilment_cost NUMERIC(10,2),
  amazon_charges NUMERIC(10,2),
  return_charges NUMERIC(10,2),
  net_profit NUMERIC(10,2),
  margin_pct NUMERIC(8,6),
  profit_on_cost_pct NUMERIC(8,6),
  fallback_level VARCHAR(50),
  is_optimal BOOLEAN DEFAULT TRUE,
  recommendation JSONB,
  price_band JSONB,
  all_scenarios JSONB
);

CREATE TABLE IF NOT EXISTS calculator_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Migrate existing DB safely ────────────────────────────────────────────────

-- Add category_name to products if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_name VARCHAR(255) DEFAULT 'Handbags';

-- Backfill category_name from category join (safe, only updates rows where category_name IS NULL)
UPDATE products p
SET    category_name = c.category_name
FROM   categories c
WHERE  p.category_id = c.id
AND    p.category_name IS NULL;

-- Add new columns to calculation_results
ALTER TABLE calculation_results ADD COLUMN IF NOT EXISTS fallback_level VARCHAR(50);
ALTER TABLE calculation_results ADD COLUMN IF NOT EXISTS is_optimal BOOLEAN DEFAULT TRUE;
ALTER TABLE calculation_results ADD COLUMN IF NOT EXISTS recommendation JSONB;
ALTER TABLE calculation_results ADD COLUMN IF NOT EXISTS price_band JSONB;
