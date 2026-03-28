CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  price        DECIMAL(10, 2) NOT NULL,
  stock_status VARCHAR(20) NOT NULL DEFAULT 'in_stock',
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_urls   TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
