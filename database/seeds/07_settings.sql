INSERT INTO calculator_settings (key, value, description) VALUES
('gst_rate',               '0.05',                   'GST rate for bags/apparel'),
('return_rate',            '0.15',                   'Estimated return rate'),
('marketing_rate',         '0.20',                   'Marketing/ad spend as % of selling price'),
('avg_storage_days',       '45',                     'Average inventory storage days'),
('storage_rate_per_day',   '0.30',                   'Storage rate per day (₹)'),
('primary_transport',      '10',                     'Primary transportation per unit (₹)'),
('bulk_packaging',         '5',                      'Bulk packaging per unit (₹)'),
('inward_charges',         '6',                      'FBA inward charges per unit (₹)'),
('outward_charges',        '10',                     'Outward dispatch per unit (₹)'),
('return_handling',        '6',                      'Return handling per unit (₹)'),
('return_logistics_cost',  '75',                     'Return shipment cost (₹)'),
('product_packaging_rate', '0.011578165732259473',   'Product packaging as % of selling price'),
('fulfillment_type',       'easy_ship',              'Default fulfillment type')
ON CONFLICT (key) DO NOTHING;
