-- Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Create organizations table for multi-tenant support
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  cnpj VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  subscription_status VARCHAR DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  max_users INTEGER DEFAULT 5,
  max_products INTEGER DEFAULT 100,
  max_sales_per_month INTEGER DEFAULT 500
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create organization_users table to link users to organizations
CREATE TABLE IF NOT EXISTS public.organization_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_owner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS on organization_users
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- Add organization_id to existing tables (people table as example)
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_people_organization_id ON public.people(organization_id);
CREATE INDEX IF NOT EXISTS idx_positions_organization_id ON public.positions(organization_id);
CREATE INDEX IF NOT EXISTS idx_categories_organization_id ON public.categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_organization_id ON public.sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_organization_id ON public.inventory_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON public.organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_org_id ON public.organization_users(organization_id);

-- Function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_users
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Update has_role function to check for super_admin across all organizations
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- RLS Policies for organizations table
-- Super admins can see all organizations, regular users can only see their own
CREATE POLICY "Super admins can view all organizations"
ON public.organizations
FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can insert organizations"
ON public.organizations
FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update organizations"
ON public.organizations
FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Organization owners can update their organization"
ON public.organizations
FOR UPDATE
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_users 
    WHERE user_id = auth.uid() AND is_owner = true
  )
);

-- RLS Policies for organization_users table
CREATE POLICY "Super admins can view all organization users"
ON public.organization_users
FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own organization users"
ON public.organization_users
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage organization users"
ON public.organization_users
FOR ALL
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Organization admins can manage their organization users"
ON public.organization_users
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT ou.organization_id 
    FROM public.organization_users ou
    WHERE ou.user_id = auth.uid()
  )
  AND public.has_role(auth.uid(), 'admin')
);

-- Update existing RLS policies to include organization_id checks
-- People table
DROP POLICY IF EXISTS "Role-based read people" ON public.people;
CREATE POLICY "Role-based read people"
ON public.people
FOR SELECT
USING (
  public.is_super_admin(auth.uid()) OR
  (
    (organization_id IS NULL OR organization_id = public.get_user_organization_id(auth.uid()))
    AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'manager') OR
      (type = 'customer' AND public.has_role(auth.uid(), 'salesperson')) OR
      (type = 'supplier' AND public.has_role(auth.uid(), 'accountant'))
    )
  )
);

DROP POLICY IF EXISTS "Role-based insert people" ON public.people;
CREATE POLICY "Role-based insert people"
ON public.people
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid()) OR
  (
    (organization_id IS NULL OR organization_id = public.get_user_organization_id(auth.uid()))
    AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'manager') OR
      (type = 'customer' AND public.has_role(auth.uid(), 'salesperson'))
    )
  )
);

-- Function to automatically set organization_id on insert
CREATE OR REPLACE FUNCTION public.set_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If organization_id is not set and user is not super admin, set it to user's organization
  IF NEW.organization_id IS NULL AND NOT public.is_super_admin(auth.uid()) THEN
    NEW.organization_id := public.get_user_organization_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Add triggers to automatically set organization_id
DROP TRIGGER IF EXISTS set_organization_id_people ON public.people;
CREATE TRIGGER set_organization_id_people
  BEFORE INSERT ON public.people
  FOR EACH ROW
  EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_organization_id_categories ON public.categories;
CREATE TRIGGER set_organization_id_categories
  BEFORE INSERT ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_organization_id_products ON public.products;
CREATE TRIGGER set_organization_id_products
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_organization_id_sales ON public.sales;
CREATE TRIGGER set_organization_id_sales
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.set_organization_id();

-- Create trigger to automatically make first user of organization an admin
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users in this organization
  SELECT COUNT(*) INTO user_count
  FROM public.organization_users
  WHERE organization_id = NEW.organization_id;

  -- If this is the first user, make them admin and owner
  IF user_count = 0 THEN
    NEW.is_owner := true;
    
    -- Insert admin role for this user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_assign_first_admin_trigger ON public.organization_users;
CREATE TRIGGER auto_assign_first_admin_trigger
  BEFORE INSERT ON public.organization_users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_first_admin();

-- Create function to handle new user signup with organization creation
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Check if this is truly a new signup (not created by admin)
  -- We'll use metadata to track this
  IF NEW.raw_user_meta_data->>'created_by_admin' IS NULL THEN
    -- Create a new organization for this user
    INSERT INTO public.organizations (name, slug, is_active)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Nova Empresa'),
      'org-' || NEW.id,
      true
    )
    RETURNING id INTO org_id;

    -- Link user to organization
    INSERT INTO public.organization_users (organization_id, user_id, is_owner)
    VALUES (org_id, NEW.id, true);

    -- First user gets admin role (handled by trigger above)
  END IF;

  RETURN NEW;
END;
$$;

-- Note: This trigger would be on auth.users which we can't directly modify in migrations
-- Instead, we'll handle this in the signup logic

-- Add comments for documentation
COMMENT ON TABLE public.organizations IS 'Multi-tenant organizations/companies using the ERP system';
COMMENT ON TABLE public.organization_users IS 'Links users to their organizations';
COMMENT ON COLUMN public.organizations.is_active IS 'System owner can enable/disable organization access';
COMMENT ON COLUMN public.organizations.subscription_status IS 'Track subscription status for each organization';
