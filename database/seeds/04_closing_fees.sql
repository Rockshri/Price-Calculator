TRUNCATE closing_fees RESTART IDENTITY;

INSERT INTO closing_fees (min_price, max_price, easy_ship, self_ship, seller_flex) VALUES
(0,    300,       1,  20,  6),
(300,  500,      22,  26, 12),
(500,  1000,     45,  51, 35),
(1000, 10000000, 76, 101, 66);
