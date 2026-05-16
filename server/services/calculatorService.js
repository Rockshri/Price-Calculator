// Exact port of Excel Calculator tab formulas.
// Costs are stored as NEGATIVE numbers matching Excel convention (G8, G9, G10).
// netProfit = sellingPrice + sellerCosts + fulfilmentCost + amazonCharges + returnCharges

const MULTIPLIER_FACTORS = [3, 3.25, 3.5, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.5];
const FIXED_PRICE_POINTS = [249, 251, 299, 301, 499, 501, 999, 1001,
                             1499, 1501, 1999, 2001, 4999, 5001, 9999, 10001];

function buildPricePoints(manufacturingCost) {
  const multiplierBased = MULTIPLIER_FACTORS.map(f => Math.round(manufacturingCost * f));
  return [...multiplierBased, ...FIXED_PRICE_POINTS]; // 26 total
}

function calculateAllCosts(product, listingPriceGST, settings, feeData) {
  const { manufacturingCost, weightGm, lengthCm, widthCm, heightCm, categoryName } = product;
  const {
    gstRate              = 0.05,
    returnRate           = 0.15,
    avgStorageDays       = 45,
    storageRatePerDay    = 0.30,
    marketingRate        = 0.20,
    primaryTransport     = 10,
    bulkPackaging        = 5,
    inwardCharges        = 6,
    outwardCharges       = 10,
    returnHandling       = 6,
    returnLogisticsCost  = 75,
    productPackagingRate = 0.011578165732259473,
  } = settings;

  // Selling price (excl. GST)
  const sellingPrice = listingPriceGST / (1 + gstRate);

  // Billable weight
  const volumetricWeightKg = (lengthCm * widthCm * heightCm) / 5000;
  const actualWeightKg     = weightGm / 1000;
  const billableWeight     = Math.max(actualWeightKg, volumetricWeightKg);

  // G8: Seller Side Costs (negative)
  const productPackaging = sellingPrice * productPackagingRate;
  const sellerCosts = -(manufacturingCost + primaryTransport + bulkPackaging + productPackaging);

  // G9: Fulfilment Cost (negative)
  const storageCharge  = avgStorageDays * storageRatePerDay;
  const adminFee       = sellingPrice / 100;
  const fulfilmentCost = -(inwardCharges + storageCharge + outwardCharges + returnHandling + adminFee);

  // G10: Amazon Charges (negative)
  const referralFee   = lookupReferralFee(feeData.referral, categoryName, listingPriceGST);
  const closingFee    = lookupClosingFee(feeData.closing, listingPriceGST, settings.fulfillmentType || 'easy_ship');
  const shippingFee   = lookupShippingCost(feeData.shipping, billableWeight);
  const marketingFee  = sellingPrice * marketingRate;
  const amazonCharges = -(referralFee + closingFee + shippingFee + marketingFee);

  // G11: Return Charges (can be negative — Amazon refunds 20% of listing on returns)
  const refundAdminFee = listingPriceGST * (-0.20);
  const returnCharges  = returnRate * (returnLogisticsCost + refundAdminFee);

  // Net Profit
  const netProfit = sellingPrice + sellerCosts + fulfilmentCost + amazonCharges + returnCharges;
  const margin    = sellingPrice !== 0 ? netProfit / sellingPrice : 0;
  const multiplier = manufacturingCost !== 0 ? listingPriceGST / manufacturingCost : 0;

  return {
    listingPriceGST,
    sellingPrice,
    billableWeight,
    multiplier,
    sellerCosts,
    fulfilmentCost,
    amazonCharges,
    returnCharges,
    netProfit,
    margin,
    breakdown: {
      productPackaging,
      storageCharge,
      adminFee,
      referralFee,
      closingFee,
      shippingFee,
      marketingFee,
      refundAdminFee,
      volumetricWeightKg,
      actualWeightKg,
    },
  };
}

function lookupReferralFee(referralTable, categoryName, listingPrice) {
  const row = referralTable.find(r =>
    r.category_name === categoryName &&
    listingPrice > Number(r.min_price) &&
    listingPrice <= Number(r.max_price)
  );
  return row ? listingPrice * Number(row.rate) : 0;
}

function lookupClosingFee(closingTable, listingPrice, type = 'easy_ship') {
  const row = closingTable.find(r =>
    listingPrice > Number(r.min_price) && listingPrice <= Number(r.max_price)
  );
  if (!row) return 0;
  const col = { easy_ship: 'easy_ship', self_ship: 'self_ship', seller_flex: 'seller_flex' }[type];
  return Number(row[col] || 0);
}

function lookupShippingCost(shippingTable, billableWeightKg) {
  const row = shippingTable.find(r =>
    billableWeightKg > Number(r.min_weight_kg) && billableWeightKg <= Number(r.max_weight_kg)
  );
  return row ? Number(row.rate) : 0;
}

module.exports = { buildPricePoints, calculateAllCosts, lookupReferralFee, lookupClosingFee, lookupShippingCost };
