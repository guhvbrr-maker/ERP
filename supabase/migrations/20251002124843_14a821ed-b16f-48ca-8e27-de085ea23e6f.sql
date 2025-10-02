-- ============================================================================
-- COMPLETAR MÓDULO DE PRODUTOS (corrigido)
-- ============================================================================

-- Criar tabelas
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50),
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50),
  description TEXT,
  color_code VARCHAR(7),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_attribute_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50),
  input_type VARCHAR(20) DEFAULT 'text',
  options JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(300) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  type VARCHAR(20) DEFAULT 'simple',
  parent_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ncm VARCHAR(8) NOT NULL,
  cest VARCHAR(7),
  cfop VARCHAR(4) DEFAULT '5102',
  origin VARCHAR(1) DEFAULT '0',
  ean VARCHAR(14),
  icms_cst VARCHAR(3),
  icms_aliquota DECIMAL(5,2),
  ipi_cst VARCHAR(2),
  ipi_aliquota DECIMAL(5,2),
  pis_cst VARCHAR(2),
  pis_aliquota DECIMAL(5,2),
  cofins_cst VARCHAR(2),
  cofins_aliquota DECIMAL(5,2),
  material_id UUID REFERENCES public.materials(id),
  fabric_id UUID REFERENCES public.fabrics(id),
  width_cm DECIMAL(10,2),
  height_cm DECIMAL(10,2),
  depth_cm DECIMAL(10,2),
  weight_kg DECIMAL(10,3),
  cost_price DECIMAL(15,2),
  selling_price DECIMAL(15,2),
  promotional_price DECIMAL(15,2),
  promo_start_date DATE,
  promo_end_date DATE,
  active BOOLEAN DEFAULT true,
  is_kit BOOLEAN DEFAULT false,
  requires_assembly BOOLEAN DEFAULT false,
  assembly_time_minutes INTEGER,
  lead_time_days INTEGER DEFAULT 0,
  brand VARCHAR(100),
  collection VARCHAR(100),
  manufacturer VARCHAR(200),
  warranty_months INTEGER DEFAULT 12,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_parent ON public.products(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_ncm ON public.products(ncm);

CREATE TABLE IF NOT EXISTS public.product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  attribute_type_id UUID REFERENCES public.product_attribute_types(id) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, attribute_type_id)
);

CREATE INDEX IF NOT EXISTS idx_product_attributes_product ON public.product_attributes(product_id);

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  alt_text VARCHAR(200),
  display_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);

CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zipcode VARCHAR(10),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) NOT NULL,
  quantity DECIMAL(15,3) DEFAULT 0,
  reserved DECIMAL(15,3) DEFAULT 0,
  min_quantity DECIMAL(15,3) DEFAULT 0,
  max_quantity DECIMAL(15,3),
  reorder_point DECIMAL(15,3),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stocks' AND column_name = 'available') THEN
    ALTER TABLE public.stocks ADD COLUMN available DECIMAL(15,3) GENERATED ALWAYS AS (quantity - reserved) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stocks_product ON public.stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_stocks_warehouse ON public.stocks(warehouse_id);

-- RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated read materials" ON public.materials;
DROP POLICY IF EXISTS "Allow authenticated read fabrics" ON public.fabrics;
DROP POLICY IF EXISTS "Allow authenticated read attribute types" ON public.product_attribute_types;
DROP POLICY IF EXISTS "Allow authenticated read products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated read product attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Allow authenticated read product images" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated read warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Allow authenticated read stocks" ON public.stocks;
DROP POLICY IF EXISTS "Allow authenticated insert materials" ON public.materials;
DROP POLICY IF EXISTS "Allow authenticated update materials" ON public.materials;
DROP POLICY IF EXISTS "Allow authenticated insert fabrics" ON public.fabrics;
DROP POLICY IF EXISTS "Allow authenticated update fabrics" ON public.fabrics;
DROP POLICY IF EXISTS "Allow authenticated insert attribute types" ON public.product_attribute_types;
DROP POLICY IF EXISTS "Allow authenticated update attribute types" ON public.product_attribute_types;
DROP POLICY IF EXISTS "Allow authenticated insert products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated update products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated delete products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated insert product attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Allow authenticated update product attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Allow authenticated delete product attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Allow authenticated insert product images" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated update product images" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated delete product images" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated insert warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Allow authenticated update warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Allow authenticated insert stocks" ON public.stocks;
DROP POLICY IF EXISTS "Allow authenticated update stocks" ON public.stocks;

-- Create policies
CREATE POLICY "Allow authenticated read materials" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read fabrics" ON public.fabrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read attribute types" ON public.product_attribute_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read product attributes" ON public.product_attributes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read product images" ON public.product_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read warehouses" ON public.warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read stocks" ON public.stocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert materials" ON public.materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update materials" ON public.materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert fabrics" ON public.fabrics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update fabrics" ON public.fabrics FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert attribute types" ON public.product_attribute_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update attribute types" ON public.product_attribute_types FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete products" ON public.products FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert product attributes" ON public.product_attributes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update product attributes" ON public.product_attributes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete product attributes" ON public.product_attributes FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert product images" ON public.product_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update product images" ON public.product_images FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete product images" ON public.product_images FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert warehouses" ON public.warehouses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update warehouses" ON public.warehouses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert stocks" ON public.stocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update stocks" ON public.stocks FOR UPDATE TO authenticated USING (true);