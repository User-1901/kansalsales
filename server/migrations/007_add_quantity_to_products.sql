-- Add quantity column to products table
ALTER TABLE products ADD COLUMN quantity_available INTEGER NOT NULL DEFAULT 100;
-- Update existing products to have quantity of 100 if they were in_stock
UPDATE products SET quantity_available = 100 WHERE stock_status = 'in_stock';
UPDATE products SET stock_status = 'in_stock' WHERE stock_status = 'out_of_stock' AND quantity_available > 0;
