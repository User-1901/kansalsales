-- Add why_shop_message column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS why_shop_message TEXT DEFAULT 'Why shop with us?
🚚 Fast Delivery - Quick delivery to your doorstep
💰 Best Prices - Quality products at competitive prices
📦 Wide Assortment - Thousands of products to choose from';
