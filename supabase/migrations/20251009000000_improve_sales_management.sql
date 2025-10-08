-- ============================================================================
-- IMPROVE SALES MANAGEMENT
-- Add salesperson, automatic stock management, and enhanced status workflow
-- ============================================================================

-- Add employee_id (salesperson) to sales table
ALTER TABLE public.sales
ADD COLUMN employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX idx_sales_employee ON public.sales(employee_id);

-- ============================================================================
-- AUTOMATIC STOCK MANAGEMENT TRIGGERS
-- ============================================================================

-- Function to update stock when sale status changes
CREATE OR REPLACE FUNCTION handle_sale_status_change()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  stock_record RECORD;
  default_warehouse_id UUID;
BEGIN
  -- Only process when status changes to 'confirmed' or 'completed'
  IF (NEW.status IN ('confirmed', 'completed') AND (OLD.status IS NULL OR OLD.status NOT IN ('confirmed', 'completed'))) THEN
    
    -- Get default warehouse (first active warehouse)
    SELECT id INTO default_warehouse_id
    FROM public.warehouses
    WHERE active = true
    ORDER BY created_at
    LIMIT 1;
    
    IF default_warehouse_id IS NULL THEN
      RAISE EXCEPTION 'Nenhum depósito ativo encontrado para processar a venda';
    END IF;
    
    -- Process each sale item
    FOR item IN 
      SELECT product_id, quantity 
      FROM public.sale_items 
      WHERE sale_id = NEW.id
    LOOP
      -- Check if stock exists for this product in the warehouse
      SELECT * INTO stock_record
      FROM public.stocks
      WHERE product_id = item.product_id 
        AND warehouse_id = default_warehouse_id;
      
      IF stock_record IS NULL THEN
        -- Create stock record if it doesn't exist (with zero quantity)
        INSERT INTO public.stocks (product_id, warehouse_id, quantity, reserved, min_quantity)
        VALUES (item.product_id, default_warehouse_id, 0, 0, 0);
        
        RAISE WARNING 'Produto % sem estoque registrado. Quantidade atual: 0, necessária: %', 
          item.product_id, item.quantity;
      ELSE
        -- Check if there's enough available stock
        IF stock_record.available < item.quantity THEN
          RAISE WARNING 'Estoque insuficiente para produto %. Disponível: %, Necessário: %', 
            item.product_id, stock_record.available, item.quantity;
        END IF;
        
        -- Reduce stock quantity
        UPDATE public.stocks
        SET quantity = quantity - item.quantity,
            updated_at = now()
        WHERE product_id = item.product_id 
          AND warehouse_id = default_warehouse_id;
      END IF;
    END LOOP;
    
  -- Restore stock when sale is cancelled (if it was previously confirmed/completed)
  ELSIF (NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'completed')) THEN
    
    -- Get default warehouse
    SELECT id INTO default_warehouse_id
    FROM public.warehouses
    WHERE active = true
    ORDER BY created_at
    LIMIT 1;
    
    IF default_warehouse_id IS NOT NULL THEN
      -- Restore stock for each item
      FOR item IN 
        SELECT product_id, quantity 
        FROM public.sale_items 
        WHERE sale_id = NEW.id
      LOOP
        UPDATE public.stocks
        SET quantity = quantity + item.quantity,
            updated_at = now()
        WHERE product_id = item.product_id 
          AND warehouse_id = default_warehouse_id;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sale status changes
DROP TRIGGER IF EXISTS trigger_sale_status_change ON public.sales;
CREATE TRIGGER trigger_sale_status_change
AFTER UPDATE OF status ON public.sales
FOR EACH ROW
EXECUTE FUNCTION handle_sale_status_change();

-- ============================================================================
-- FUNCTION TO CHECK STOCK AVAILABILITY BEFORE SALE
-- ============================================================================

CREATE OR REPLACE FUNCTION check_sale_stock_availability(sale_items JSONB)
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  requested_quantity NUMERIC,
  available_quantity NUMERIC,
  has_stock BOOLEAN,
  warning_message TEXT
) AS $$
DECLARE
  item JSONB;
  stock_record RECORD;
  product_record RECORD;
  default_warehouse_id UUID;
BEGIN
  -- Get default warehouse
  SELECT id INTO default_warehouse_id
  FROM public.warehouses
  WHERE active = true
  ORDER BY created_at
  LIMIT 1;
  
  -- Process each item
  FOR item IN SELECT * FROM jsonb_array_elements(sale_items)
  LOOP
    -- Get product info
    SELECT id, name INTO product_record
    FROM public.products
    WHERE id = (item->>'product_id')::UUID;
    
    -- Get stock info
    SELECT s.available INTO stock_record
    FROM public.stocks s
    WHERE s.product_id = (item->>'product_id')::UUID
      AND s.warehouse_id = default_warehouse_id;
    
    product_id := (item->>'product_id')::UUID;
    product_name := product_record.name;
    requested_quantity := (item->>'quantity')::NUMERIC;
    
    IF stock_record.available IS NULL THEN
      available_quantity := 0;
      has_stock := FALSE;
      warning_message := 'Produto sem estoque cadastrado';
    ELSE
      available_quantity := stock_record.available;
      IF stock_record.available >= requested_quantity THEN
        has_stock := TRUE;
        warning_message := NULL;
      ELSIF stock_record.available = 0 THEN
        has_stock := FALSE;
        warning_message := 'ESTOQUE ZERADO';
      ELSE
        has_stock := FALSE;
        warning_message := 'Estoque insuficiente';
      END IF;
    END IF;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_sale_stock_availability(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_sale_status_change() TO authenticated;
