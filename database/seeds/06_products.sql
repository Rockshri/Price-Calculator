TRUNCATE products RESTART IDENTITY CASCADE;

INSERT INTO products (sr_no, product_name, category_name, weight_gm, length_cm, width_cm, height_cm, manufacturing_cost) VALUES
(1,  'Maaee Classic Suta Tote',        'Handbags', 299, 43, 42, 3.5, 371),
(2,  'Maaee Classic Suta Tote',        'Handbags', 299, 43, 42, 3.5, 389),
(3,  'Maaee Double Pocket Tote (3-A)', 'Handbags', 345, 41, 38, 3.5, 399),
(4,  'Maaee Double Pocket Tote (3-B)', 'Handbags', 321, 41, 38, 3.5, 329),
(5,  'Maaee Double Pocket Tote (4-A)', 'Handbags', 325, 41, 38, 3.5, 399),
(6,  'Maaee Double Pocket Tote (4-B)', 'Handbags', 321, 41, 38, 3.5, 329),
(7,  'Sanjeeda Tote',                  'Handbags', 225, 39, 36, 2.5, 339),
(8,  'Sanjeeda Tote',                  'Handbags', 225, 39, 36, 2.5, 339),
(9,  'Courtyard Classic Tote',         'Handbags', 272, 41, 37, 2.5, 509),
(10, 'Courtyard Classic Tote',         'Handbags', 272, 41, 37, 2.5, 499),
(11, 'Utility Pouch',                  'Handbags',  57, 20, 16, 2.5, 109),
(12, 'Maaee Mobile Bodycross',         'Handbags',  57, 19, 15, 2.0, 149),
(13, 'Maaee Mobile Bodycross',         'Handbags',  57, 19, 15, 2.0, 149),
(14, 'Maaee Suta Handale Tote',        'Handbags', 208, 39, 37, 2.5, 199),
(15, 'Maaee Suta Handale Tote',        'Handbags', 204, 39, 37, 2.5, 199),
(16, 'Maaee Suta Handale Tote',        'Handbags', 199, 39, 37, 2.5, 185),
(17, 'Everyday Tote',                  'Handbags', 199, 39, 37, 2.5, 224),
(18, 'Everyday Tote - Black',          'Handbags', 199, 39, 37, 2.5, 224),
(19, 'Everyday Tote - Black',          'Handbags', 199, 39, 37, 2.5, 224),
(20, 'Maaee Suta Handle Tote',         'Handbags', 197, 39, 37, 2.5, 224);
