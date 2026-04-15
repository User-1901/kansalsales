-- Add HSN code for invoice/bill generation
-- HSN codes are 4-8 digit codes used for tax classification in India
ALTER TABLE products 
ADD COLUMN hsn_code VARCHAR(20) DEFAULT NULL;

-- Create index for HSN code lookups during billing
CREATE INDEX idx_products_hsn_code ON products(hsn_code);
