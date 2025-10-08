-- Add user_id to employees table
ALTER TABLE public.employees 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;

-- Create table to map positions to system roles
CREATE TABLE public.position_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid REFERENCES public.positions(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(position_id, role)
);

-- Enable RLS on position_roles
ALTER TABLE public.position_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for position_roles (only admins and managers)
CREATE POLICY "Role-based read position_roles"
ON public.position_roles FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Role-based insert position_roles"
ON public.position_roles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Role-based update position_roles"
ON public.position_roles FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Role-based delete position_roles"
ON public.position_roles FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Function to sync employee roles based on their positions
CREATE OR REPLACE FUNCTION public.sync_employee_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  emp_user_id uuid;
BEGIN
  -- Get the user_id for this employee
  SELECT user_id INTO emp_user_id
  FROM employees
  WHERE id = COALESCE(NEW.employee_id, OLD.employee_id);

  -- Only proceed if employee has a user account
  IF emp_user_id IS NOT NULL THEN
    -- Delete existing roles for this user
    DELETE FROM user_roles WHERE user_id = emp_user_id;
    
    -- Insert new roles based on current positions
    INSERT INTO user_roles (user_id, role)
    SELECT DISTINCT emp_user_id, pr.role
    FROM employee_positions ep
    JOIN position_roles pr ON pr.position_id = ep.position_id
    WHERE ep.employee_id = (SELECT id FROM employees WHERE user_id = emp_user_id)
      AND ep.ended_at IS NULL;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger on employee_positions changes
CREATE TRIGGER sync_roles_on_position_change
AFTER INSERT OR UPDATE OR DELETE ON public.employee_positions
FOR EACH ROW
EXECUTE FUNCTION public.sync_employee_roles();

-- Trigger on employees user_id change
CREATE TRIGGER sync_roles_on_employee_user_change
AFTER UPDATE OF user_id ON public.employees
FOR EACH ROW
WHEN (NEW.user_id IS DISTINCT FROM OLD.user_id)
EXECUTE FUNCTION public.sync_employee_roles();