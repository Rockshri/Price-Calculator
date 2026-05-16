import {
  pgTable, serial, varchar, numeric, integer,
  boolean, text, timestamp, jsonb,
} from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  mainCategory: varchar('main_category', { length: 50 }).notNull(),
  categoryName: varchar('category_name', { length: 255 }).unique().notNull(),
});

export const referralFees = pgTable('referral_fees', {
  id: serial('id').primaryKey(),
  mainCategory: varchar('main_category', { length: 50 }),
  categoryName: varchar('category_name', { length: 255 }),
  minPrice: numeric('min_price', { precision: 12, scale: 2 }).default('0'),
  maxPrice: numeric('max_price', { precision: 12, scale: 2 }),
  rate: numeric('rate', { precision: 6, scale: 4 }),
});

export const closingFees = pgTable('closing_fees', {
  id: serial('id').primaryKey(),
  minPrice: numeric('min_price', { precision: 12, scale: 2 }),
  maxPrice: numeric('max_price', { precision: 12, scale: 2 }),
  easyShip: numeric('easy_ship', { precision: 8, scale: 2 }),
  selfShip: numeric('self_ship', { precision: 8, scale: 2 }),
  sellerFlex: numeric('seller_flex', { precision: 8, scale: 2 }),
});

export const shippingCosts = pgTable('shipping_costs', {
  id: serial('id').primaryKey(),
  minWeightKg: numeric('min_weight_kg', { precision: 6, scale: 3 }),
  maxWeightKg: numeric('max_weight_kg', { precision: 6, scale: 3 }),
  rate: numeric('rate', { precision: 8, scale: 2 }),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  srNo: integer('sr_no'),
  productName: varchar('product_name', { length: 255 }).notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  weightGm: numeric('weight_gm', { precision: 8, scale: 2 }),
  lengthCm: numeric('length_cm', { precision: 8, scale: 2 }),
  widthCm: numeric('width_cm', { precision: 8, scale: 2 }),
  heightCm: numeric('height_cm', { precision: 8, scale: 2 }),
  manufacturingCost: numeric('manufacturing_cost', { precision: 10, scale: 2 }),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const calculationResults = pgTable('calculation_results', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow(),
  fulfillmentType: varchar('fulfillment_type', { length: 20 }).default('easy_ship'),
  gstRate: numeric('gst_rate', { precision: 5, scale: 4 }).default('0.05'),
  returnRate: numeric('return_rate', { precision: 5, scale: 4 }).default('0.15'),
  avgStorageDays: integer('avg_storage_days').default(45),
  storageRatePerDay: numeric('storage_rate_per_day', { precision: 8, scale: 4 }).default('0.30'),
  marketingRate: numeric('marketing_rate', { precision: 5, scale: 4 }).default('0.20'),
  bestListingPrice: numeric('best_listing_price', { precision: 10, scale: 2 }),
  bestSellingPrice: numeric('best_selling_price', { precision: 10, scale: 2 }),
  sellerSideCosts: numeric('seller_side_costs', { precision: 10, scale: 2 }),
  fulfilmentCost: numeric('fulfilment_cost', { precision: 10, scale: 2 }),
  amazonCharges: numeric('amazon_charges', { precision: 10, scale: 2 }),
  returnCharges: numeric('return_charges', { precision: 10, scale: 2 }),
  netProfit: numeric('net_profit', { precision: 10, scale: 2 }),
  marginPct: numeric('margin_pct', { precision: 8, scale: 6 }),
  profitOnCostPct: numeric('profit_on_cost_pct', { precision: 8, scale: 6 }),
  allScenarios: jsonb('all_scenarios'),
});

export const calculatorSettings = pgTable('calculator_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
