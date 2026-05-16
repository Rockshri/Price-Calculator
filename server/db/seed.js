import { db } from './index.js';
import {
  categories, referralFees, closingFees,
  shippingCosts, products, calculatorSettings,
} from './schema.js';

async function seed() {
  console.log('Seeding database...');

  // Categories
  const insertedCategories = await db.insert(categories).values([
    { mainCategory: 'Other Hardline', categoryName: 'Handbags' },
    { mainCategory: 'Other Hardline', categoryName: 'Luggage & Travel Accessories' },
    { mainCategory: 'Other Hardline', categoryName: 'Wallets' },
    { mainCategory: 'Other Hardline', categoryName: 'Backpacks' },
    { mainCategory: 'Other Hardline', categoryName: 'Briefcases & Laptop Bags' },
    { mainCategory: 'Other Hardline', categoryName: 'Clothing' },
    { mainCategory: 'Other Hardline', categoryName: 'Shoes' },
    { mainCategory: 'Other Hardline', categoryName: 'Jewellery' },
    { mainCategory: 'Other Hardline', categoryName: 'Watches' },
    { mainCategory: 'Media', categoryName: 'Books' },
    { mainCategory: 'Media', categoryName: 'Music' },
    { mainCategory: 'Media', categoryName: 'Movies & TV' },
    { mainCategory: 'CE/PC/Wireless', categoryName: 'Mobile Phones' },
    { mainCategory: 'CE/PC/Wireless', categoryName: 'Laptops' },
    { mainCategory: 'CE/PC/Wireless', categoryName: 'Tablets' },
    { mainCategory: 'CE/PC/Wireless', categoryName: 'Cameras' },
    { mainCategory: 'Consumables', categoryName: 'Beauty' },
    { mainCategory: 'Consumables', categoryName: 'Health & Personal Care' },
    { mainCategory: 'Consumables', categoryName: 'Grocery' },
  ]).onConflictDoNothing().returning();

  console.log(`Seeded ${insertedCategories.length} categories`);

  // Referral fees for Handbags
  await db.insert(referralFees).values([
    { mainCategory: 'Other Hardline', categoryName: 'Handbags', minPrice: '0', maxPrice: '1000', rate: '0.0000' },
    { mainCategory: 'Other Hardline', categoryName: 'Handbags', minPrice: '1000.01', maxPrice: null, rate: '0.2000' },
    { mainCategory: 'Other Hardline', categoryName: 'Clothing', minPrice: '0', maxPrice: '1000', rate: '0.1000' },
    { mainCategory: 'Other Hardline', categoryName: 'Clothing', minPrice: '1000.01', maxPrice: null, rate: '0.1700' },
    { mainCategory: 'Other Hardline', categoryName: 'Shoes', minPrice: '0', maxPrice: '1000', rate: '0.1000' },
    { mainCategory: 'Other Hardline', categoryName: 'Shoes', minPrice: '1000.01', maxPrice: null, rate: '0.1700' },
    { mainCategory: 'Other Hardline', categoryName: 'Jewellery', minPrice: '0', maxPrice: '1000', rate: '0.1400' },
    { mainCategory: 'Other Hardline', categoryName: 'Jewellery', minPrice: '1000.01', maxPrice: null, rate: '0.1700' },
    { mainCategory: 'Other Hardline', categoryName: 'Watches', minPrice: '0', maxPrice: '1000', rate: '0.1300' },
    { mainCategory: 'Other Hardline', categoryName: 'Watches', minPrice: '1000.01', maxPrice: null, rate: '0.1500' },
    { mainCategory: 'Media', categoryName: 'Books', minPrice: '0', maxPrice: null, rate: '0.0500' },
    { mainCategory: 'CE/PC/Wireless', categoryName: 'Mobile Phones', minPrice: '0', maxPrice: null, rate: '0.0400' },
    { mainCategory: 'CE/PC/Wireless', categoryName: 'Laptops', minPrice: '0', maxPrice: null, rate: '0.0500' },
    { mainCategory: 'Consumables', categoryName: 'Beauty', minPrice: '0', maxPrice: null, rate: '0.1400' },
  ]).onConflictDoNothing();

  console.log('Seeded referral fees');

  // Closing fees
  await db.insert(closingFees).values([
    { minPrice: '0',      maxPrice: '300',    easyShip: '1',  selfShip: '20',  sellerFlex: '6'  },
    { minPrice: '300.01', maxPrice: '500',    easyShip: '22', selfShip: '26',  sellerFlex: '12' },
    { minPrice: '500.01', maxPrice: '1000',   easyShip: '45', selfShip: '51',  sellerFlex: '35' },
    { minPrice: '1000.01',maxPrice: null,     easyShip: '76', selfShip: '101', sellerFlex: '66' },
  ]).onConflictDoNothing();

  console.log('Seeded closing fees');

  // Shipping costs (Easy Ship by billable weight)
  await db.insert(shippingCosts).values([
    { minWeightKg: '0',    maxWeightKg: '0.5',  rate: '55'  },
    { minWeightKg: '0.5',  maxWeightKg: '1',    rate: '75'  },
    { minWeightKg: '1',    maxWeightKg: '2',     rate: '112' },
    { minWeightKg: '2',    maxWeightKg: '3',     rate: '146' },
    { minWeightKg: '3',    maxWeightKg: '4',     rate: '180' },
    { minWeightKg: '4',    maxWeightKg: '5',     rate: '214' },
    { minWeightKg: '5',    maxWeightKg: '6',     rate: '248' },
    { minWeightKg: '6',    maxWeightKg: '7',     rate: '282' },
    { minWeightKg: '7',    maxWeightKg: '8',     rate: '316' },
    { minWeightKg: '8',    maxWeightKg: '9',     rate: '350' },
    { minWeightKg: '9',    maxWeightKg: '10',    rate: '384' },
    { minWeightKg: '10',   maxWeightKg: '25',    rate: '500' },
  ]).onConflictDoNothing();

  console.log('Seeded shipping costs');

  // Products — look up Handbags category id
  const handbagsCat = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.categoryName, 'Handbags'),
  });
  const catId = handbagsCat?.id ?? null;

  await db.insert(products).values([
    { srNo: 1,  productName: 'Maaee Classic Suta Tote',     categoryId: catId, weightGm: '299', lengthCm: '43', widthCm: '42', heightCm: '3.5', manufacturingCost: '371' },
    { srNo: 2,  productName: 'Maaee Classic Suta Tote',     categoryId: catId, weightGm: '299', lengthCm: '43', widthCm: '42', heightCm: '3.5', manufacturingCost: '389' },
    { srNo: 3,  productName: 'Maaee Double Pocket Tote',    categoryId: catId, weightGm: '345', lengthCm: '41', widthCm: '38', heightCm: '3.5', manufacturingCost: '399' },
    { srNo: 4,  productName: 'Maaee Double Pocket Tote',    categoryId: catId, weightGm: '321', lengthCm: '41', widthCm: '38', heightCm: '3.5', manufacturingCost: '329' },
    { srNo: 5,  productName: 'Maaee Double Pocket Tote',    categoryId: catId, weightGm: '325', lengthCm: '41', widthCm: '38', heightCm: '3.5', manufacturingCost: '399' },
    { srNo: 6,  productName: 'Maaee Double Pocket Tote',    categoryId: catId, weightGm: '321', lengthCm: '41', widthCm: '38', heightCm: '3.5', manufacturingCost: '329' },
    { srNo: 7,  productName: 'Sanjeeda Tote',               categoryId: catId, weightGm: '225', lengthCm: '39', widthCm: '36', heightCm: '2.5', manufacturingCost: '339' },
    { srNo: 8,  productName: 'Sanjeeda Tote',               categoryId: catId, weightGm: '225', lengthCm: '39', widthCm: '36', heightCm: '2.5', manufacturingCost: '339' },
    { srNo: 9,  productName: 'Courtyard Classic Tote',      categoryId: catId, weightGm: '272', lengthCm: '41', widthCm: '37', heightCm: '2.5', manufacturingCost: '509' },
    { srNo: 10, productName: 'Courtyard Classic Tote',      categoryId: catId, weightGm: '272', lengthCm: '41', widthCm: '37', heightCm: '2.5', manufacturingCost: '499' },
    { srNo: 11, productName: 'Utility Pouch',               categoryId: catId, weightGm: '57',  lengthCm: '20', widthCm: '16', heightCm: '2.5', manufacturingCost: '109' },
    { srNo: 12, productName: 'Maaee Mobile Bodycross',      categoryId: catId, weightGm: '57',  lengthCm: '19', widthCm: '15', heightCm: '2',   manufacturingCost: '149' },
    { srNo: 13, productName: 'Maaee Mobile Bodycross',      categoryId: catId, weightGm: '57',  lengthCm: '19', widthCm: '15', heightCm: '2',   manufacturingCost: '149' },
    { srNo: 14, productName: 'Maaee Suta Handale Tote',     categoryId: catId, weightGm: '208', lengthCm: '39', widthCm: '37', heightCm: '2.5', manufacturingCost: '199' },
    { srNo: 15, productName: 'Maaee Suta Handale Tote',     categoryId: catId, weightGm: '204', lengthCm: '39', widthCm: '37', heightCm: '2.5', manufacturingCost: '199' },
    { srNo: 16, productName: 'Maaee Suta Handale Tote',     categoryId: catId, weightGm: '199', lengthCm: '39', widthCm: '37', heightCm: '2.5', manufacturingCost: '185' },
    { srNo: 17, productName: 'Product 15',                  categoryId: catId, weightGm: '199', lengthCm: '39', widthCm: '37', heightCm: '2.5', manufacturingCost: '224' },
    { srNo: 18, productName: 'Everyday Tote - Black',       categoryId: catId, weightGm: '199', lengthCm: '39', widthCm: '37', heightCm: '2.5', manufacturingCost: '224' },
    { srNo: 19, productName: 'Everyday Tote - Black',       categoryId: catId, weightGm: '199', lengthCm: '39', widthCm: '37', heightCm: '2.5', manufacturingCost: '224' },
    { srNo: 20, productName: 'Maaee Suta Handle Tote',      categoryId: catId, weightGm: '197', lengthCm: '39', widthCm: '37', heightCm: '2.5', manufacturingCost: '224' },
  ]).onConflictDoNothing();

  console.log('Seeded 20 products');

  // Calculator settings
  await db.insert(calculatorSettings).values([
    { key: 'primary_transportation',  value: '10',    description: 'Fixed per-unit primary transport cost (₹)' },
    { key: 'bulk_packaging',          value: '5',     description: 'Fixed per-unit bulk packaging cost (₹)' },
    { key: 'inward_charges',          value: '6',     description: 'FBA inward charges per unit (₹)' },
    { key: 'outward_charges',         value: '10',    description: 'Outward dispatch charges per unit (₹)' },
    { key: 'return_handling',         value: '6',     description: 'Return handling charges per unit (₹)' },
    { key: 'avg_storage_days',        value: '45',    description: 'Average inventory storage days' },
    { key: 'storage_rate_per_day',    value: '0.30',  description: 'Storage rate per day (₹)' },
    { key: 'gst_rate',                value: '0.05',  description: 'GST rate (5% for apparel/bags)' },
    { key: 'return_rate',             value: '0.15',  description: 'Estimated return rate (15%)' },
    { key: 'return_logistics_cost',   value: '75',    description: 'Cost per return shipment (₹)' },
    { key: 'marketing_rate',          value: '0.20',  description: 'Marketing/advertising rate (20% of selling price)' },
    { key: 'max_multiplier_threshold',value: '7',     description: 'Max allowed listing/cost multiplier for best scenario' },
    { key: 'product_packaging_rate',   value: '0.01158', description: 'Product packaging as % of selling price' },
    { key: 'admin_fee_rate',           value: '0.01',   description: 'Admin fee as % of selling price' },
    // Multi-layer best-scenario scoring thresholds
    { key: 'min_margin_primary',       value: '0.15',   description: 'Primary filter: minimum margin % (15%)' },
    { key: 'min_margin_fallback',      value: '0.10',   description: 'Fallback 1 filter: minimum margin % (10%)' },
    { key: 'score_weight_margin',      value: '0.50',   description: 'Composite score weight for margin (50%)' },
    { key: 'score_weight_conversion',  value: '0.30',   description: 'Composite score weight for conversion likelihood (30%)' },
    { key: 'score_weight_profit_rupee',value: '0.20',   description: 'Composite score weight for absolute rupee profit (20%)' },
  ]).onConflictDoNothing();

  console.log('Seeded calculator settings');
  console.log('Database seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
