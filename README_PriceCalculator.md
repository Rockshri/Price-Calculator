# 🛒 Amazon India Price Calculator — Full-Stack Web App

**Business:** Maaee Courtyard (Handmade Tote Bags & Accessories)  
**Platform Target:** Amazon India (Easy Ship / Self-Ship / Seller Flex)  
**Tech Stack:** React · Node.js · Express · PostgreSQL  

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Excel File Architecture — Sheet-by-Sheet Analysis](#2-excel-file-architecture)
3. [Core Calculation Logic (Ported from Excel)](#3-core-calculation-logic)
4. [VBA Macro — RunAllProducts (Business Logic)](#4-vba-macro-analysis)
5. [Database Schema (PostgreSQL)](#5-database-schema)
6. [Backend API (Node.js + Express)](#6-backend-api)
7. [Frontend (React)](#7-frontend-react)
8. [Project Folder Structure](#8-project-folder-structure)
9. [Environment Variables](#9-environment-variables)
10. [Setup & Run Instructions](#10-setup--run-instructions)
11. [Business Rules & Constraints](#11-business-rules--constraints)
12. [Known Issues in Original Excel](#12-known-issues-in-original-excel)

---

## 1. Project Overview

This application is a **full digital port** of the Excel-based Amazon India Price Calculator used by Maaee Courtyard. The Excel workbook (`Price_Calculator-Maaeecourtyard-_with_vba.xlsm`) contains:

- A **product catalog** (20 SKUs of tote bags & pouches)
- A **multi-scenario pricing engine** (26 price-point scenarios per product)
- Amazon India's **referral fee, closing fee, shipping cost, and fulfilment cost** data tables
- A **VBA macro** (`RunAllProducts`) that automates scenario evaluation for all products and writes optimised prices to a Results sheet

The web app replaces this with a live, browser-based calculator that any team member can use without Excel or macros.

---

## 2. Excel File Architecture

The workbook has **9 active sheets**:

### Sheet 1 — `Scenerio Check`
**Purpose:** Quick "what-if" sandbox — enter one product's inputs and immediately see the best-optimised output.

| Field | Cell | Notes |
|---|---|---|
| Manufacturing Cost | C3 | In ₹ |
| Product Weight (gm) | C4 | Grams |
| Length (cm) | C6 | Including packaging |
| Width (cm) | C7 | Including packaging |
| Height (cm) | C8 | Including packaging |
| **Listing Price (incl. GST)** | Output | Pulled from best scenario |
| **Selling Price (excl. GST)** | Output | Listing ÷ 1.05 |
| **Net Profit per Unit** | Output | After all Amazon deductions |
| **Margin %** | Output | Net Profit ÷ Selling Price |

> **Note:** This sheet feeds into the Working Sheet scenarios via cell references. The VBA macro also pushes values here before running each product.

---

### Sheet 2 — `Data`
**Purpose:** Master product catalog. Source of truth for the VBA batch run.

| Column | Field | Example |
|---|---|---|
| A | Sr. No. | 1–20 |
| B | Image | (embedded image — #VALUE in text export) |
| C | Product Description | "Product 01 / Maaee Classic Suta Tote" |
| D | Dimension label | (merged label cell) |
| E | Weight (gm) | 299 |
| F | Length (cm) | 43 |
| G | Breadth (cm) | 42 |
| H | Height (cm) | 3.5 |
| I | Cost Price (₹) | 371 |

**20 Products in catalog:**

| # | Product | Weight | L×W×H | Cost |
|---|---|---|---|---|
| 1 | Maaee Classic Suta Tote | 299g | 43×42×3.5 | ₹371 |
| 2 | Maaee Classic Suta Tote | 299g | 43×42×3.5 | ₹389 |
| 3-A | Maaee Double Pocket Tote | 345g | 41×38×3.5 | ₹399 |
| 3-B | Maaee Double Pocket Tote | 321g | 41×38×3.5 | ₹329 |
| 4-A | Maaee Double Pocket Tote | 325g | 41×38×3.5 | ₹399 |
| 4-B | Maaee Double Pocket Tote | 321g | 41×38×3.5 | ₹329 |
| 5 | Sanjeeda Tote | 225g | 39×36×2.5 | ₹339 |
| 6 | Sanjeeda Tote | 225g | 39×36×2.5 | ₹339 |
| 7 | Courtyard Classic Tote | 272g | 41×37×2.5 | ₹509 |
| 8 | Courtyard Classic Tote | 272g | 41×37×2.5 | ₹499 |
| 9 | Utility Pouch | 57g | 20×16×2.5 | ₹109 |
| 10 | Maaee Mobile Bodycross | 57g | 19×15×2 | ₹149 |
| 11 | Maaee Mobile Bodycross | 57g | 19×15×2 | ₹149 |
| 12 | Maaee Suta Handale Tote | 208g | 39×37×2.5 | ₹199 |
| 13 | Maaee Suta Handale Tote | 204g | 39×37×2.5 | ₹199 |
| 14 | Maaee Suta Handale Tote | 199g | 39×37×2.5 | ₹185 |
| 15 | (Unnamed) | 199g | 39×37×2.5 | ₹224 |
| 16 | Everyday Tote - Black | 199g | 39×37×2.5 | ₹224 |
| 17 | Everyday Tote - Black | 199g | 39×37×2.5 | ₹224 |
| 18 | Maaee Suta Handle Tote | 197g | 39×37×2.5 | ₹224 |

---

### Sheet 3 — `Working Sheet`
**Purpose:** The scenario engine. Evaluates **26 price-point scenarios** per product and determines which one yields the highest margin.

**26 Scenarios — Price Points:**

| Scenario | Multiplier | Listing Price (₹) |
|---|---|---|
| 1 | 3.00× | 249 |
| 2 | 3.25× | 251 |
| 3 | 3.50× | 299 |
| 4 | 4.00× | 301 |
| 5 | 4.25× | 499 |
| 6 | 4.50× | 501 |
| 7 | 4.75× | 999 |
| 8 | 5.00× | 1001 |
| 9 | 5.25× | 1499 |
| 10 | 5.50× | 1501 |
| 11–12 | ~1.11–1.12× | ₹249 / ₹251 |
| 13–14 | ~1.33–1.34× | ₹299 / ₹301 |
| 15–16 | ~2.23× | ₹499 / ₹501 |
| 17–18 | ~4.46× | ₹999 / ₹1001 |
| 19–20 | ~6.69× | ₹1499 / ₹1501 |
| 21–22 | ~8.92× | ₹1999 / ₹2001 |
| 23–24 | ~22.32× | ₹4999 / ₹5001 |
| 25–26 | ~44.64× | ₹9999 / ₹10001 |

> The ₹249, ₹499, ₹999 etc. breakpoints are chosen deliberately because **Amazon's closing fees change at those price boundaries.**

**Per-scenario rows computed:**

| Row | Field |
|---|---|
| 3 | Multiplying Factor |
| 4 | Listing Price (incl. GST) |
| 5 | Selling Price (excl. GST) |
| 6 | (−) Seller Side Costs |
| 7 | (−) Fulfilment Cost |
| 8 | (−) Amazon Charges |
| 9 | (−) Return Charges |
| 10 | Net Profit per Unit |
| 11 | Margin % |
| C13 | **Best Scenario** (XLOOKUP formula) |
| C14 | **Maximum Multiplying Factor** |

**Best Scenario Selection Formula:**
```
=XLOOKUP(MAXIFS(Row11, Row3, "<=7"), Row11, Row2)
```
This picks the scenario with the **highest margin** where the multiplying factor is **≤ 7** (a business constraint that keeps prices within a reasonable range relative to cost).

---

### Sheet 4 — `Calculator`
**Purpose:** The core computation engine. Inputs from one product are fed here; all cost components are calculated.

#### INPUTS Section

| Input | Value Used in Testing |
|---|---|
| Product Category | Handbags |
| Manufacturing Cost | ₹224 |
| Product Weight | 197 gm |
| Length | 39 cm |
| Width | 37 cm |
| Height | 2.5 cm |
| Listing Price (incl. GST) | ₹728 |
| GST Rate | 5% |

#### SELLER COST Breakdown

| Component | Amount | Notes |
|---|---|---|
| Manufacturing Cost | ₹224.00 | Direct input |
| Primary Transportation | ₹10.00 | Fixed flat rate |
| Bulk Packaging | ₹5.00 | Fixed flat rate |
| Product Packaging | ₹41.77 | Calculated (≈ 1.16% of Selling Price) |
| **Total Seller Side Costs** | **₹280.77** | |

#### FULFILMENT & RETURN COST Breakdown

| Component | Amount | Notes |
|---|---|---|
| Inward Charges | ₹6.00 | Fixed |
| Storage Charges | ₹13.50 | 45 days × ₹0.30/day |
| Outward Charges | ₹10.00 | Fixed |
| Return Handling | ₹6.00 | Fixed |
| Admin Fee | ₹6.93 | Variable (based on Selling Price) |
| **Total Fulfilment Cost** | **₹36.43** | |

#### AMAZON CHARGES Breakdown

| Component | Amount | Notes |
|---|---|---|
| Referral Fees | ₹0 | Varies by category & price (see Referral Fees sheet) |
| Closing Fees | ₹45.00 | ₹500–₹999 bracket for Easy Ship |
| Shipping Charges | ₹75.00 | Based on billable weight (0.5–1 kg bracket) |
| Marketing Charges | ₹138.67 | 20% of Selling Price |
| **Total Amazon Charges** | **₹258.67** | |

#### RETURN CHARGES

| Component | Amount | Notes |
|---|---|---|
| Estimated Return Rate | 15% | Business assumption |
| Return Logistics Cost | ₹75.00 | |
| Refund Admin Fee | −₹0 (20% deducted) | |
| **Total Return Charges** | **₹12.15** | |

#### PROFITABILITY SUMMARY (for ₹728 listing price example)

| Metric | Value |
|---|---|
| Listing Price (incl. GST) | ₹728.00 |
| Selling Price (excl. GST) | ₹693.33 |
| (−) Seller Side Costs | −₹280.77 (−40.5%) |
| (−) Fulfilment Cost | −₹36.43 (−5.3%) |
| (−) Amazon Charges | −₹258.67 (−37.3%) |
| (−) Return Charges | −₹12.15 (−1.8%) |
| **Net Profit per Unit** | **₹105.32** |
| **Margin %** | **15.19%** |

---

### Sheet 5 — `Categories`
**Purpose:** Dropdown source list for the product category selector. Contains all Amazon India category names (~200+ categories) across main groups: Media, Consumables, Other Hardline, CE/PC/Wireless.

---

### Sheet 6 — `Referral Fees`
**Purpose:** Lookup table for Amazon referral fees. Fees are tiered by category and listing price.

**Key rates for Handbags (relevant to Maaee):**
- Handbags: 0% for price ≤ ₹1,000 | **20%** for price > ₹1,000

**Structure:** `(Main Category, Category, Min Price, Max Price) → Rate %`

---

### Sheet 7 — `Closing Fees`
**Purpose:** Amazon's fixed closing fee by price bracket and fulfilment type.

| Price Range | Easy Ship | Self-Ship | Seller Flex |
|---|---|---|---|
| ₹0 – ₹300 | ₹1 | ₹20 | ₹6 |
| ₹301 – ₹500 | ₹22 | ₹26 | ₹12 |
| ₹501 – ₹1,000 | ₹45 | ₹51 | ₹35 |
| ₹1,001+ | ₹76 | ₹101 | ₹66 |

> This is why the scenarios use ₹249/₹251 and ₹999/₹1001 price pairs — to test both sides of each fee boundary.

---

### Sheet 8 — `Shipping Cost`
**Purpose:** Easy Ship standard shipping rate lookup by billable weight.

| Weight Range | Rate (₹) |
|---|---|
| 0 – 0.5 kg | ₹55 |
| 0.5 – 1 kg | ₹75 |
| 1 – 2 kg | ₹112 |
| 2 – 3 kg | ₹146 |
| 3 – 4 kg | ₹180 |
| 4 – 5 kg | ₹214 |
| (continues up to 25 kg) | |

**Billable Weight Calculation:**
```
Volumetric Weight (kg) = (L_cm × W_cm × H_cm) / 5000
Billable Weight = MAX(actual_weight_kg, volumetric_weight_kg)
```

---

### Sheet 9 — `Results`
**Purpose:** Output sheet generated fresh on every VBA macro run. Populated automatically — do not edit manually.

**Output per product (15 rows × N product columns):**

| Row | Field | Format |
|---|---|---|
| 1 | Sr. No. | Number |
| 2 | Product Description | Text (wrapped) |
| 3 | Manufacturing Cost | ₹#,##0.00 |
| 4 | Product Weight (gm) | Number |
| 5–7 | L / W / H (cm) | Number |
| 8 | Listing Price (incl. GST) | ₹#,##0.00 (best scenario) |
| 9 | Seller Side Costs | ₹#,##0.00 |
| 10 | Fulfilment Cost | ₹#,##0.00 |
| 11 | Amazon Charges | ₹#,##0.00 |
| 12 | Return Charges | ₹#,##0.00 |
| 13 | **Net Profit** | ₹#,##0.00 (bold, grey bg) |
| 14 | **Margin %** | 0.0% (bold, grey bg) |
| 15 | **Profit as % of Cost** | 0.0% (bold, grey bg) |

---

## 3. Core Calculation Logic

### Step-by-step formula chain (implement as service functions)

```
INPUT: manufacturingCost, weight_gm, length_cm, width_cm, height_cm,
       category, listingPriceGST, gstRate=0.05, returnRate=0.15

1. SELLING PRICE
   sellingPrice = listingPriceGST / (1 + gstRate)

2. BILLABLE WEIGHT
   volumetricWeight_kg = (length_cm × width_cm × height_cm) / 5000
   actualWeight_kg = weight_gm / 1000
   billableWeight = MAX(actualWeight_kg, volumetricWeight_kg)

3. SELLER SIDE COSTS
   productPackaging = sellingPrice × 0.01158   [≈ 1.16% of SP, from calculator]
   sellerCost = manufacturingCost + 10 + 5 + productPackaging

4. FULFILMENT COST
   storageCharge = avgStorageDays × storageRate   [45 × 0.30 = 13.50]
   adminFee = sellingPrice × 0.01   [approx 1% admin]
   fulfilmentCost = 6 + storageCharge + 10 + 6 + adminFee

5. AMAZON CHARGES
   referralFee = lookupReferralFee(category, listingPriceGST)
   closingFee  = lookupClosingFee(listingPriceGST, fulfilmentType='easyship')
   shippingFee = lookupShippingCost(billableWeight)
   marketingFee = sellingPrice × 0.20
   amazonCharges = referralFee + closingFee + shippingFee + marketingFee

6. RETURN CHARGES
   returnLogisticsCost = 75
   refundAdminFee = listingPriceGST × (-0.20)   [negative = Amazon refunds 20%]
   returnCharges = returnRate × (returnLogisticsCost + refundAdminFee)

7. NET PROFIT
   netProfit = sellingPrice - sellerCost - fulfilmentCost - amazonCharges - returnCharges

8. MARGIN
   margin = netProfit / sellingPrice

9. PROFIT AS % OF COST
   profitOnCost = netProfit / manufacturingCost
```

### Scenario Optimization Algorithm

```javascript
// Run for all 26 price points
const PRICE_POINTS = [249, 251, 299, 301, 499, 501, 999, 1001,
                      1499, 1501, 1999, 2001, 4999, 5001, 9999, 10001];

function findBestScenario(product) {
  const results = PRICE_POINTS.map(price => ({
    listingPrice: price,
    ...calculateAllCosts(product, price)
  }));

  // Best = highest margin where multiplying factor <= 7
  // multiplying factor = listingPrice / manufacturingCost
  const eligible = results.filter(r => r.listingPrice / product.cost <= 7);
  return eligible.reduce((best, r) => r.margin > best.margin ? r : best);
}
```

---

## 4. VBA Macro Analysis

**Macro Name:** `RunAllProducts` (Module1)

### What it does (5-step process):

```
STEP 1 — Setup
  - Delete existing Results sheet
  - Create fresh Results sheet with 15 labelled rows
  - Apply formatting to label column (grey bg, bold)

STEP 2 — Loop Products (Data sheet rows 2 to lastRow)
  - Read: Sr.No, Description, Weight, L, W, H, CostPrice
  - Skip if any dimension = 0

STEP 3 — Per-product scenario loop (1 to 26)
  - Push product inputs to Calculator tab (cells D7, D8, D10, D11, D12)
  - Push same inputs to Scenerio Check tab
  - For each scenario i:
      → Write listing price into Calculator D13
      → Force Application.CalculateFull
      → Read back costs from G8:G11 (Calculator outputs)
      → Write costs to Working Sheet row 6–9 for that scenario column

STEP 4 — Read Best Scenario
  - Application.Calculate triggers XLOOKUP formula in Working Sheet C13
  - bestScenNum = Working Sheet C13 value
  - Push best scenario's listing price back to Calculator D13
  - Read final: bestListing, bestSeller, bestFulfil, bestAmazon, bestReturn,
                bestProfit, bestMargin from Working Sheet

STEP 5 — Write Results Column
  - Input rows (1–7): Yellow fill (RGB 255,255,204)
  - Cost rows (8–12): White fill
  - Summary rows (13–15): Grey fill (RGB 217,217,217), Bold
  - Number formats: ₹#,##0.00 for costs, 0.0% for margins
  - AutoFit columns, medium border on divider row 7
  - Advance nextCol counter

FINISH — Apply full table borders, show MsgBox with count
```

### Port to Node.js:

Replace the VBA loop with a **POST /api/products/batch-calculate** endpoint that:
1. Reads all products from PostgreSQL `products` table
2. Runs `calculateAllCosts()` across all 26 price points per product
3. Selects best scenario
4. Writes results to `calculation_results` table
5. Returns JSON array of results

---

## 5. Database Schema

```sql
-- Categories (from Categories sheet)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  main_category VARCHAR(50) NOT NULL,  -- 'Media', 'Other Hardline', 'CE/PC/Wireless', 'Consumables'
  category_name VARCHAR(255) UNIQUE NOT NULL
);

-- Referral Fees (from Referral Fees sheet)
CREATE TABLE referral_fees (
  id SERIAL PRIMARY KEY,
  main_category VARCHAR(50),
  category_name VARCHAR(255),
  min_price NUMERIC(12,2) DEFAULT 0,
  max_price NUMERIC(12,2),
  rate NUMERIC(6,4),   -- e.g. 0.2000 = 20%
  FOREIGN KEY (category_name) REFERENCES categories(category_name)
);

-- Closing Fees (from Closing Fees sheet)
CREATE TABLE closing_fees (
  id SERIAL PRIMARY KEY,
  min_price NUMERIC(12,2),
  max_price NUMERIC(12,2),
  easy_ship NUMERIC(8,2),
  self_ship NUMERIC(8,2),
  seller_flex NUMERIC(8,2)
);

-- Shipping Costs (from Shipping Cost sheet)
CREATE TABLE shipping_costs (
  id SERIAL PRIMARY KEY,
  min_weight_kg NUMERIC(6,3),
  max_weight_kg NUMERIC(6,3),
  rate NUMERIC(8,2)
);

-- Products (from Data sheet)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sr_no INTEGER,
  product_name VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
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

-- Calculation Results (replaces Results sheet)
CREATE TABLE calculation_results (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  fulfillment_type VARCHAR(20) DEFAULT 'easy_ship',  -- easy_ship | self_ship | seller_flex
  gst_rate NUMERIC(5,4) DEFAULT 0.05,
  return_rate NUMERIC(5,4) DEFAULT 0.15,
  avg_storage_days INTEGER DEFAULT 45,
  storage_rate_per_day NUMERIC(8,4) DEFAULT 0.30,
  marketing_rate NUMERIC(5,4) DEFAULT 0.20,
  -- Best scenario outputs
  best_listing_price NUMERIC(10,2),
  best_selling_price NUMERIC(10,2),
  seller_side_costs NUMERIC(10,2),
  fulfilment_cost NUMERIC(10,2),
  amazon_charges NUMERIC(10,2),
  return_charges NUMERIC(10,2),
  net_profit NUMERIC(10,2),
  margin_pct NUMERIC(8,6),
  profit_on_cost_pct NUMERIC(8,6),
  -- All 26 scenario snapshots (stored as JSONB)
  all_scenarios JSONB
);

-- Calculator Settings (configurable parameters)
CREATE TABLE calculator_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data for calculator_settings
INSERT INTO calculator_settings (key, value, description) VALUES
  ('primary_transportation', '10', 'Fixed per-unit primary transport cost (₹)'),
  ('bulk_packaging', '5', 'Fixed per-unit bulk packaging cost (₹)'),
  ('inward_charges', '6', 'FBA inward charges per unit (₹)'),
  ('outward_charges', '10', 'Outward dispatch charges per unit (₹)'),
  ('return_handling', '6', 'Return handling charges per unit (₹)'),
  ('avg_storage_days', '45', 'Average inventory storage days'),
  ('storage_rate_per_day', '0.30', 'Storage rate per day (₹)'),
  ('gst_rate', '0.05', 'GST rate (5% for apparel/bags)'),
  ('return_rate', '0.15', 'Estimated return rate (15%)'),
  ('return_logistics_cost', '75', 'Cost per return shipment (₹)'),
  ('marketing_rate', '0.20', 'Marketing/advertising rate (20% of selling price)'),
  ('max_multiplier_threshold', '7', 'Max allowed listing/cost multiplier for best scenario');
```

---

## 6. Backend API

### Routes

```
GET    /api/categories                    — All categories (for dropdown)
GET    /api/products                      — All products
GET    /api/products/:id                  — Single product
POST   /api/products                      — Add new product
PUT    /api/products/:id                  — Update product
DELETE /api/products/:id                  — Soft delete product

POST   /api/calculator/single            — Calculate one product at one price point
POST   /api/calculator/scenarios         — Calculate all 26 scenarios for one product
POST   /api/calculator/batch             — Run all products (replaces VBA RunAllProducts)
GET    /api/results                       — All saved results
GET    /api/results/:product_id          — Results for one product

GET    /api/settings                      — All calculator settings
PUT    /api/settings/:key                 — Update a setting

GET    /api/fees/referral?category=X&price=Y  — Lookup referral fee
GET    /api/fees/closing?price=Y&type=Z       — Lookup closing fee
GET    /api/fees/shipping?weight=W            — Lookup shipping cost
```

### Key Service: `calculatorService.js`

```javascript
// services/calculatorService.js

const PRICE_POINTS = [249, 251, 299, 301, 499, 501, 999, 1001,
                      1499, 1501, 1999, 2001, 4999, 5001, 9999, 10001];

async function calculateSingleScenario(product, listingPriceGST, settings, fees) {
  const { manufacturingCost, weightGm, lengthCm, widthCm, heightCm } = product;
  const { gstRate, returnRate, avgStorageDays, storageRatePerDay,
          marketingRate, primaryTransport, bulkPackaging,
          inwardCharges, outwardCharges, returnHandling, returnLogisticsCost } = settings;

  // 1. Selling price
  const sellingPrice = listingPriceGST / (1 + gstRate);

  // 2. Billable weight
  const volumetricWeightKg = (lengthCm * widthCm * heightCm) / 5000;
  const actualWeightKg = weightGm / 1000;
  const billableWeight = Math.max(actualWeightKg, volumetricWeightKg);

  // 3. Seller costs
  const productPackaging = sellingPrice * 0.01158;
  const sellerCosts = manufacturingCost + primaryTransport + bulkPackaging + productPackaging;

  // 4. Fulfilment cost
  const storageCharge = avgStorageDays * storageRatePerDay;
  const adminFee = sellingPrice * (6.9333 / 693.33);  // proportional to SP
  const fulfilmentCost = inwardCharges + storageCharge + outwardCharges + returnHandling + adminFee;

  // 5. Amazon charges
  const referralFee = await lookupReferralFee(product.categoryName, listingPriceGST);
  const closingFee = await lookupClosingFee(listingPriceGST, 'easy_ship');
  const shippingFee = await lookupShippingCost(billableWeight);
  const marketingFee = sellingPrice * marketingRate;
  const amazonCharges = referralFee + closingFee + shippingFee + marketingFee;

  // 6. Return charges
  const refundAdmin = listingPriceGST * (-0.20);
  const returnCharges = returnRate * (returnLogisticsCost + refundAdmin);

  // 7. Net profit & margin
  const netProfit = sellingPrice - sellerCosts - fulfilmentCost - amazonCharges - returnCharges;
  const margin = netProfit / sellingPrice;
  const profitOnCost = netProfit / manufacturingCost;
  const multiplier = listingPriceGST / manufacturingCost;

  return {
    listingPriceGST, sellingPrice, billableWeight,
    sellerCosts, fulfilmentCost, amazonCharges, returnCharges,
    netProfit, margin, profitOnCost, multiplier
  };
}

async function findBestScenario(product, settings) {
  const maxMultiplier = parseFloat(settings.maxMultiplierThreshold);  // 7.0

  const scenarios = await Promise.all(
    PRICE_POINTS.map(price => calculateSingleScenario(product, price, settings))
  );

  const eligible = scenarios.filter(s => s.multiplier <= maxMultiplier);
  if (!eligible.length) return scenarios[0];  // fallback

  return eligible.reduce((best, s) => s.margin > best.margin ? s : best);
}
```

---

## 7. Frontend (React)

### Pages / Views

```
/                     → Dashboard (summary cards: total products, avg margin, top performer)
/products             → Product list table (sortable, filterable)
/products/new         → Add product form
/products/:id         → Product detail + scenario chart
/calculator           → Single product live calculator (mirrors "Scenerio Check" sheet)
/results              → Results table (mirrors Results sheet, exportable to CSV)
/settings             → Calculator parameters editor
```

### Key Components

```
<ProductForm />          — Add/edit product with category dropdown (from Categories sheet)
<ScenarioChart />        — Bar chart: all 26 scenarios, margin vs listing price
<CostBreakdown />        — Pie/bar showing seller/fulfilment/amazon/return split
<PricingTable />         — The Results sheet equivalent, all products side-by-side
<LiveCalculator />       — Real-time single calculator (like "Scenerio Check" sheet)
<SettingsPanel />        — Edit all calculator_settings rows
```

### State Management

- Use **React Query (TanStack Query)** for server state (products, results, fees)
- Use **useState / useReducer** for calculator form state
- No Redux needed at this scale

---

## 8. Project Folder Structure

```
price-calculator/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProductForm.jsx
│   │   │   ├── ScenarioChart.jsx
│   │   │   ├── CostBreakdown.jsx
│   │   │   ├── PricingTable.jsx
│   │   │   └── LiveCalculator.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Calculator.jsx
│   │   │   ├── Results.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/
│   │   │   └── api.js               # Axios API calls
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/                          # Node.js + Express backend
│   ├── config/
│   │   └── db.js                    # PostgreSQL pool (pg)
│   ├── routes/
│   │   ├── products.js
│   │   ├── calculator.js
│   │   ├── results.js
│   │   ├── categories.js
│   │   ├── fees.js
│   │   └── settings.js
│   ├── services/
│   │   ├── calculatorService.js     # Core logic (port of Excel formulas + VBA)
│   │   ├── feeService.js            # Referral / Closing / Shipping lookups
│   │   └── batchService.js          # RunAllProducts equivalent
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── app.js
│   └── package.json
│
├── database/
│   ├── schema.sql                   # Full schema (section 5 above)
│   ├── seeds/
│   │   ├── 01_categories.sql        # Seeded from Categories sheet
│   │   ├── 02_referral_fees.sql     # Seeded from Referral Fees sheet
│   │   ├── 03_closing_fees.sql      # Seeded from Closing Fees sheet
│   │   ├── 04_shipping_costs.sql    # Seeded from Shipping Cost sheet
│   │   ├── 05_products.sql          # Seeded from Data sheet (20 products)
│   │   └── 06_settings.sql          # Default calculator settings
│   └── migrations/
│
└── README.md                        # This file
```

---

## 9. Environment Variables

```bash
# server/.env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/price_calculator
NODE_ENV=development

# client/.env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 10. Setup & Run Instructions

```bash
# 1. Clone repository
git clone <repo-url>
cd price-calculator

# 2. Set up PostgreSQL database
createdb price_calculator
psql price_calculator < database/schema.sql
psql price_calculator < database/seeds/01_categories.sql
psql price_calculator < database/seeds/02_referral_fees.sql
psql price_calculator < database/seeds/03_closing_fees.sql
psql price_calculator < database/seeds/04_shipping_costs.sql
psql price_calculator < database/seeds/05_products.sql
psql price_calculator < database/seeds/06_settings.sql

# 3. Start backend
cd server
npm install
npm run dev       # nodemon app.js on port 5000

# 4. Start frontend
cd ../client
npm install
npm run dev       # Vite dev server on port 5173

# 5. Open browser
# http://localhost:5173
```

---

## 11. Business Rules & Constraints

| Rule | Source | Value |
|---|---|---|
| GST Rate (Bags) | Calculator sheet | 5% |
| Estimated Return Rate | Calculator sheet | 15% |
| Marketing Spend | Calculator sheet | 20% of Selling Price |
| Average Storage Days | Calculator sheet | 45 days |
| Storage Rate | Calculator sheet | ₹0.30/day |
| Primary Transport | Calculator sheet | ₹10 flat |
| Bulk Packaging | Calculator sheet | ₹5 flat |
| Inward Charges | Calculator sheet | ₹6 |
| Outward Charges | Calculator sheet | ₹10 |
| Return Handling | Calculator sheet | ₹6 |
| Return Logistics | Calculator sheet | ₹75 |
| Max Multiplier for Best Scenario | Working Sheet formula | 7× |
| Fulfilment Type default | Calculator | Easy Ship |
| Volumetric weight divisor | Standard Amazon | 5000 |
| Billable weight | Standard Amazon | MAX(actual, volumetric) |
| Price points tested | Working Sheet | ₹249/251/299/301/499/501/999/1001/1499/1501/1999/2001/4999/5001/9999/10001 |

---

## 12. Known Issues in Original Excel

| Issue | Location | Impact |
|---|---|---|
| `#N/A` errors in Scenerio Check | C10:C17 | Output cells fail when no scenario qualifies; handle in code with fallback |
| `#VALUE!` in Data sheet (col B) | Image column | Embedded images can't be text-extracted; store image URLs in DB instead |
| `maxCol` untyped in VBA | Module1 line ~95 | `Dim maxCol` missing — declared as Variant; use `Integer` in ported code |
| Storage charge formula uses flat ₹13.50 | Calculator | Verify: is this `45 × 0.30` or a separate hardcode? Treat as configurable |
| Marketing rate hardcoded as 0.20 | Calculator | Should be a setting; different products may use different ad budgets |
| Handbags referral = 0% below ₹1000 | Referral Fees | At ₹728 listing → referral fee = ₹0, which is correct per Amazon's fee schedule |
| Scenarios 11–26 use very low multipliers | Working Sheet | Values like 1.11× generate listing prices below cost — these will always show negative margin and be filtered out by the ≤7× constraint |

---

*This README was generated by analysing the Excel file `Price_Calculator-Maaeecourtyard-_with_vba.xlsm` including all 9 sheets, all formula logic, and the full VBA macro `RunAllProducts`. All numbers, fee tables, and business rules are sourced directly from the file.*
