-- ============================================================================
-- MÓDULO DE PRODUTOS E CATEGORIAS - MÓVEIS KARINA ERP (CORRIGIDO)
-- ============================================================================

-- 1) CATEGORIAS (Árvore hierárquica)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_active ON public.categories(active);

-- 2) MATERIAIS (Madeira, MDF, Metal, etc.)
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50),
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) TECIDOS (Suede, Veludo, Couro, etc.)
CREATE TABLE public.fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50),
  description TEXT,
  color_code VARCHAR(7),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4) TIPOS DE ATRIBUTOS CUSTOMIZÁVEIS (Cor, Acabamento, etc.)
CREATE TABLE public.product_attribute_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50),
  input_type VARCHAR(20) DEFAULT 'text', -- text, select, color, number
  options JSONB, -- para select: [{value, label}]
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5) PRODUTOS (Principal - pode ser simples ou pai de variações)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(300) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  
  -- Tipo de produto
  type VARCHAR(20) DEFAULT 'simple', -- simple, parent, variant
  parent_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Dados Fiscais (NF-e)
  ncm VARCHAR(8) NOT NULL, -- Nomenclatura Comum do Mercosul
  cest VARCHAR(7), -- Código Especificador da Substituição Tributária
  cfop VARCHAR(4) DEFAULT '5102', -- Código Fiscal de Operações
  origin VARCHAR(1) DEFAULT '0', -- 0=Nacional, 1=Estrangeira-Importação direta, etc.
  ean VARCHAR(14), -- Código de barras GTIN/EAN
  
  -- Tributação
  icms_cst VARCHAR(3), -- Código de Situação Tributária ICMS
  icms_aliquota DECIMAL(5,2),
  ipi_cst VARCHAR(2),
  ipi_aliquota DECIMAL(5,2),
  pis_cst VARCHAR(2),
  pis_aliquota DECIMAL(5,2),
  cofins_cst VARCHAR(2),
  cofins_aliquota DECIMAL(5,2),
  
  -- Ficha Técnica
  material_id UUID REFERENCES public.materials(id),
  fabric_id UUID REFERENCES public.fabrics(id),
  width_cm DECIMAL(10,2), -- Largura
  height_cm DECIMAL(10,2), -- Altura
  depth_cm DECIMAL(10,2), -- Profundidade
  weight_kg DECIMAL(10,3),
  
  -- Preços
  cost_price DECIMAL(15,2), -- Preço de custo
  selling_price DECIMAL(15,2), -- Preço de venda
  promotional_price DECIMAL(15,2),
  promo_start_date DATE,
  promo_end_date DATE,
  
  -- Controle
  active BOOLEAN DEFAULT true,
  is_kit BOOLEAN DEFAULT false,
  requires_assembly BOOLEAN DEFAULT false,
  assembly_time_minutes INTEGER,
  lead_time_days INTEGER DEFAULT 0,
  
  -- Metadados
  brand VARCHAR(100),
  collection VARCHAR(100),
  manufacturer VARCHAR(200),
  warranty_months INTEGER DEFAULT 12,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_type ON public.products(type);
CREATE INDEX idx_products_parent ON public.products(parent_id);
CREATE INDEX idx_products_active ON public.products(active);
CREATE INDEX idx_products_ncm ON public.products(ncm);

-- 6) ATRIBUTOS DO PRODUTO (valores dos atributos customizáveis)
CREATE TABLE public.product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  attribute_type_id UUID REFERENCES public.product_attribute_types(id) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, attribute_type_id)
);

CREATE INDEX idx_product_attributes_product ON public.product_attributes(product_id);

-- 7) IMAGENS DO PRODUTO
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  alt_text VARCHAR(200),
  display_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_images_product ON public.product_images(product_id);

-- 8) DEPÓSITOS/ARMAZÉNS
CREATE TABLE public.warehouses (
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

-- 9) ESTOQUE (corrigido - campo available)
CREATE TABLE public.stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) NOT NULL,
  quantity DECIMAL(15,3) DEFAULT 0,
  reserved DECIMAL(15,3) DEFAULT 0,
  available DECIMAL(15,3) GENERATED ALWAYS AS (quantity - reserved) STORED,
  min_quantity DECIMAL(15,3) DEFAULT 0,
  max_quantity DECIMAL(15,3),
  reorder_point DECIMAL(15,3),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

CREATE INDEX idx_stocks_product ON public.stocks(product_id);
CREATE INDEX idx_stocks_warehouse ON public.stocks(warehouse_id);

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON public.stocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura (todos autenticados podem ler)
CREATE POLICY "Allow authenticated read categories" ON public.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read materials" ON public.materials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read fabrics" ON public.fabrics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read attribute types" ON public.product_attribute_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read products" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read product attributes" ON public.product_attributes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read product images" ON public.product_images
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read warehouses" ON public.warehouses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read stocks" ON public.stocks
  FOR SELECT TO authenticated USING (true);

-- Políticas de escrita (todos autenticados podem escrever - ajustar depois com roles)
CREATE POLICY "Allow authenticated insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update categories" ON public.categories
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete categories" ON public.categories
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert materials" ON public.materials
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update materials" ON public.materials
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert fabrics" ON public.fabrics
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update fabrics" ON public.fabrics
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert attribute types" ON public.product_attribute_types
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update attribute types" ON public.product_attribute_types
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update products" ON public.products
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete products" ON public.products
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert product attributes" ON public.product_attributes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update product attributes" ON public.product_attributes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete product attributes" ON public.product_attributes
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert product images" ON public.product_images
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update product images" ON public.product_images
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete product images" ON public.product_images
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert warehouses" ON public.warehouses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update warehouses" ON public.warehouses
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert stocks" ON public.stocks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update stocks" ON public.stocks
  FOR UPDATE TO authenticated USING (true);