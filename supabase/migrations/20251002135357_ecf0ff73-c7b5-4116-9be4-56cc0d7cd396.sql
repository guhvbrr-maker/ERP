-- Create settings table for application configuration
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key character varying NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Allow authenticated read settings" 
ON public.settings 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert settings
CREATE POLICY "Allow authenticated insert settings" 
ON public.settings 
FOR INSERT 
WITH CHECK (true);

-- Allow authenticated users to update settings
CREATE POLICY "Allow authenticated update settings" 
ON public.settings 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings for automatic SKU
INSERT INTO public.settings (key, value, description)
VALUES 
  ('sku_auto_generate', '{"enabled": false, "prefix": "", "start_number": 1, "current_number": 1}'::jsonb, 'Configuração de geração automática de SKU'),
  ('company_info', '{"name": "", "cnpj": "", "address": ""}'::jsonb, 'Informações da empresa');
