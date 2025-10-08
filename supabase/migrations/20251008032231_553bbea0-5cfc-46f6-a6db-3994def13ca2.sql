-- Create enum for account types
CREATE TYPE public.account_type AS ENUM ('receivable', 'payable');

-- Create enum for payment status
CREATE TYPE public.payment_status_type AS ENUM ('pending', 'partially_paid', 'paid', 'overdue', 'cancelled');

-- Create enum for recurrence type
CREATE TYPE public.recurrence_type AS ENUM ('installment', 'monthly', 'biweekly', 'annual', 'none');

-- Create payment methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  has_installments BOOLEAN DEFAULT false,
  has_fees BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create card brands table
CREATE TABLE public.card_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  code VARCHAR,
  icon_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create card fees table (taxas por bandeira e parcelamento)
CREATE TABLE public.card_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_brand_id UUID NOT NULL REFERENCES public.card_brands(id) ON DELETE CASCADE,
  installments INTEGER NOT NULL,
  fee_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  fixed_fee NUMERIC(10,2) DEFAULT 0,
  days_to_receive INTEGER DEFAULT 30,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(card_brand_id, installments)
);

-- Create bank accounts / cash registers
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL DEFAULT 'checking',
  bank_name VARCHAR,
  agency VARCHAR,
  account_number VARCHAR,
  initial_balance NUMERIC(15,2) DEFAULT 0,
  current_balance NUMERIC(15,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create financial accounts table (master table for both receivables and payables)
CREATE TABLE public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type account_type NOT NULL,
  description VARCHAR NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  remaining_amount NUMERIC(15,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status payment_status_type NOT NULL DEFAULT 'pending',
  
  -- Payment info
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  card_brand_id UUID REFERENCES public.card_brands(id) ON DELETE SET NULL,
  installments INTEGER DEFAULT 1,
  installment_number INTEGER DEFAULT 1,
  fee_percentage NUMERIC(5,2) DEFAULT 0,
  fee_amount NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(15,2),
  
  -- Bank account
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  
  -- Recurrence
  recurrence_type recurrence_type DEFAULT 'none',
  recurrence_end_date DATE,
  parent_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  
  -- Relations
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  customer_id UUID,
  supplier_id UUID,
  
  -- Additional info
  notes TEXT,
  document_number VARCHAR,
  category VARCHAR,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payment transactions table (for partial payments and history)
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create card reconciliation table
CREATE TABLE public.card_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_brand_id UUID NOT NULL REFERENCES public.card_brands(id) ON DELETE CASCADE,
  reference_date DATE NOT NULL,
  expected_amount NUMERIC(15,2) NOT NULL,
  received_amount NUMERIC(15,2) DEFAULT 0,
  difference NUMERIC(15,2) DEFAULT 0,
  status VARCHAR NOT NULL DEFAULT 'pending',
  notes TEXT,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  reconciled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create card reconciliation items
CREATE TABLE public.card_reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id UUID NOT NULL REFERENCES public.card_reconciliations(id) ON DELETE CASCADE,
  financial_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  expected_date DATE NOT NULL,
  expected_amount NUMERIC(15,2) NOT NULL,
  received_amount NUMERIC(15,2) DEFAULT 0,
  is_reconciled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_reconciliation_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated read payment_methods"
ON public.payment_methods FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated manage payment_methods"
ON public.payment_methods FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Allow authenticated read card_brands"
ON public.card_brands FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated manage card_brands"
ON public.card_brands FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Allow authenticated read card_fees"
ON public.card_fees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated manage card_fees"
ON public.card_fees FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Allow financial read bank_accounts"
ON public.bank_accounts FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Allow financial manage bank_accounts"
ON public.bank_accounts FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Allow financial read accounts"
ON public.financial_accounts FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Allow financial insert accounts"
ON public.financial_accounts FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Allow financial update accounts"
ON public.financial_accounts FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Allow financial delete accounts"
ON public.financial_accounts FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Allow financial read transactions"
ON public.payment_transactions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Allow financial insert transactions"
ON public.payment_transactions FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Allow financial read reconciliations"
ON public.card_reconciliations FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Allow financial manage reconciliations"
ON public.card_reconciliations FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Allow financial read reconciliation_items"
ON public.card_reconciliation_items FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Allow financial manage reconciliation_items"
ON public.card_reconciliation_items FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- Triggers
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_card_fees_updated_at
BEFORE UPDATE ON public.card_fees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_accounts_updated_at
BEFORE UPDATE ON public.financial_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update bank account balance
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  balance_change NUMERIC;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Calculate balance change based on transaction type
    IF NEW.bank_account_id IS NOT NULL THEN
      SELECT CASE 
        WHEN fa.account_type = 'receivable' THEN NEW.amount
        WHEN fa.account_type = 'payable' THEN -NEW.amount
        ELSE 0
      END INTO balance_change
      FROM financial_accounts fa
      WHERE fa.id = NEW.financial_account_id;
      
      UPDATE bank_accounts
      SET current_balance = current_balance + balance_change
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_balance_on_payment
AFTER INSERT ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_bank_account_balance();

-- Function to update financial account status and amounts
CREATE OR REPLACE FUNCTION public.update_financial_account_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_paid NUMERIC;
  account_amount NUMERIC;
BEGIN
  -- Calculate total paid for this account
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payment_transactions
  WHERE financial_account_id = NEW.financial_account_id;
  
  -- Get account amount
  SELECT amount INTO account_amount
  FROM financial_accounts
  WHERE id = NEW.financial_account_id;
  
  -- Update the financial account
  UPDATE financial_accounts
  SET 
    paid_amount = total_paid,
    remaining_amount = account_amount - total_paid,
    status = CASE
      WHEN total_paid >= account_amount THEN 'paid'::payment_status_type
      WHEN total_paid > 0 THEN 'partially_paid'::payment_status_type
      ELSE 'pending'::payment_status_type
    END,
    payment_date = CASE
      WHEN total_paid >= account_amount THEN CURRENT_DATE
      ELSE payment_date
    END
  WHERE id = NEW.financial_account_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_account_status_on_payment
AFTER INSERT ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_financial_account_status();

-- Insert default payment methods
INSERT INTO public.payment_methods (name, type, has_installments, has_fees) VALUES
('Dinheiro', 'cash', false, false),
('PIX', 'pix', false, false),
('Cartão de Crédito', 'credit_card', true, true),
('Cartão de Débito', 'debit_card', false, true),
('Boleto', 'bank_slip', false, false),
('Transferência', 'transfer', false, false),
('Cheque', 'check', false, false);

-- Insert default card brands
INSERT INTO public.card_brands (name, code) VALUES
('Visa', 'visa'),
('Mastercard', 'mastercard'),
('American Express', 'amex'),
('Elo', 'elo'),
('Hipercard', 'hipercard'),
('Diners', 'diners');