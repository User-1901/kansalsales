-- Add discount support to products table
ALTER TABLE products 
ADD COLUMN discount_percentage DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN discount_price DECIMAL(10, 2);

-- Create index for filtering by active discounts
CREATE INDEX idx_products_discount ON products(discount_percentage) WHERE discount_percentage > 0;
