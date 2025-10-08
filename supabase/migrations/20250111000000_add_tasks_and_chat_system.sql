-- ============================================================================
-- TASK MANAGEMENT AND INTERNAL CHAT SYSTEM
-- Complete collaborative features for ERP system
-- ============================================================================

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  manager_employee_id UUID REFERENCES public.employees(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_departments_active ON public.departments(active);

-- 2. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  
  -- Organization
  department_id UUID REFERENCES public.departments(id),
  related_to_type VARCHAR CHECK (related_to_type IN (
    'sale', 'purchase', 'production', 'delivery', 'assistance', 'assembly', 'other'
  )),
  related_to_id UUID, -- Generic reference to related entity
  
  -- Status and Priority
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Aguardando início
    'in_progress',  -- Em andamento
    'blocked',      -- Bloqueado
    'review',       -- Em revisão
    'completed',    -- Concluído
    'cancelled'     -- Cancelado
  )),
  priority VARCHAR NOT NULL DEFAULT 'normal' CHECK (priority IN (
    'low', 'normal', 'high', 'urgent'
  )),
  
  -- Assignment
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES public.employees(id),
  
  -- Dates
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Tags for categorization
  tags TEXT[]
);

CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_department ON public.tasks(department_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);

-- 3. TASK ASSIGNMENTS (for multiple assignees)
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  role VARCHAR, -- lead, collaborator, reviewer
  UNIQUE(task_id, employee_id)
);

CREATE INDEX idx_task_assignments_task ON public.task_assignments(task_id);
CREATE INDEX idx_task_assignments_employee ON public.task_assignments(employee_id);

-- 4. TASK COMMENTS
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_created ON public.task_comments(created_at DESC);

-- 5. CHAT CHANNELS
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  
  -- Type of channel
  channel_type VARCHAR NOT NULL DEFAULT 'department' CHECK (channel_type IN (
    'department',  -- Channel for a department
    'team',        -- Project/team channel
    'direct',      -- Direct message between 2 users
    'general'      -- General company channel
  )),
  
  -- References
  department_id UUID REFERENCES public.departments(id),
  
  -- Settings
  is_private BOOLEAN DEFAULT false,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_channels_type ON public.chat_channels(channel_type);
CREATE INDEX idx_chat_channels_department ON public.chat_channels(department_id);

-- 6. CHAT CHANNEL MEMBERS
CREATE TABLE IF NOT EXISTS public.chat_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  UNIQUE(channel_id, user_id)
);

CREATE INDEX idx_chat_members_channel ON public.chat_channel_members(channel_id);
CREATE INDEX idx_chat_members_user ON public.chat_channel_members(user_id);

-- 7. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  
  -- Message metadata
  reply_to_message_id UUID REFERENCES public.chat_messages(id),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  -- Attachments (file URLs)
  attachments JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification details
  title VARCHAR NOT NULL,
  message TEXT,
  notification_type VARCHAR NOT NULL CHECK (notification_type IN (
    'task_assigned',
    'task_due_soon',
    'task_overdue',
    'task_completed',
    'task_comment',
    'chat_message',
    'mention',
    'sale_status',
    'purchase_approved',
    'delivery_scheduled',
    'assistance_assigned',
    'system'
  )),
  
  -- References
  related_to_type VARCHAR,
  related_to_id UUID,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Link to navigate
  action_url VARCHAR,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);

-- 9. ACTIVITY LOG (for audit trail)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_log_user ON public.activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_channels_updated_at BEFORE UPDATE ON public.chat_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create notifications for task assignment
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
  assignee_user_id UUID;
BEGIN
  -- Get user_id from employee
  SELECT user_id INTO assignee_user_id
  FROM public.employees
  WHERE id = NEW.assigned_to;
  
  -- Only create notification if employee has a user account
  IF assignee_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      notification_type,
      related_to_type,
      related_to_id,
      action_url
    ) VALUES (
      assignee_user_id,
      'Nova tarefa atribuída',
      NEW.title,
      'task_assigned',
      'task',
      NEW.id,
      '/tasks/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_task_assignment
AFTER INSERT ON public.tasks
FOR EACH ROW
WHEN (NEW.assigned_to IS NOT NULL)
EXECUTE FUNCTION notify_task_assignment();

-- Function to notify on task due date approaching
CREATE OR REPLACE FUNCTION check_task_due_dates()
RETURNS void AS $$
DECLARE
  task_record RECORD;
  assignee_user_id UUID;
BEGIN
  -- Check for tasks due in next 24 hours that are not completed
  FOR task_record IN
    SELECT t.id, t.title, t.assigned_to, t.due_date
    FROM public.tasks t
    WHERE t.status NOT IN ('completed', 'cancelled')
      AND t.due_date IS NOT NULL
      AND t.due_date > now()
      AND t.due_date <= now() + INTERVAL '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.related_to_id = t.id
          AND n.notification_type = 'task_due_soon'
          AND n.created_at > now() - INTERVAL '24 hours'
      )
  LOOP
    -- Get user_id from employee
    SELECT user_id INTO assignee_user_id
    FROM public.employees
    WHERE id = task_record.assigned_to;
    
    IF assignee_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        notification_type,
        related_to_type,
        related_to_id,
        action_url
      ) VALUES (
        assignee_user_id,
        'Tarefa vence em breve',
        task_record.title || ' vence em ' || to_char(task_record.due_date, 'DD/MM/YYYY HH24:MI'),
        'task_due_soon',
        'task',
        task_record.id,
        '/tasks/' || task_record.id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-update task status when started
CREATE OR REPLACE FUNCTION auto_update_task_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If started_at is set and status is pending, change to in_progress
  IF NEW.started_at IS NOT NULL AND OLD.started_at IS NULL AND NEW.status = 'pending' THEN
    NEW.status := 'in_progress';
  END IF;
  
  -- If completed_at is set, change status to completed
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    NEW.status := 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_task_status
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION auto_update_task_status();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Departments policies (managers and admins can manage)
CREATE POLICY "Everyone can view departments"
  ON public.departments FOR SELECT
  USING (true);

CREATE POLICY "Managers can manage departments"
  ON public.departments FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Tasks policies
CREATE POLICY "Users can view their tasks and department tasks"
  ON public.tasks FOR SELECT
  USING (
    auth.uid() = created_by OR
    assigned_to IN (SELECT id FROM public.employees WHERE user_id = auth.uid()) OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Users can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their assigned tasks"
  ON public.tasks FOR UPDATE
  USING (
    auth.uid() = created_by OR
    assigned_to IN (SELECT id FROM public.employees WHERE user_id = auth.uid()) OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admins and managers can delete tasks"
  ON public.tasks FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Task assignments policies
CREATE POLICY "Users can view task assignments"
  ON public.task_assignments FOR SELECT
  USING (true);

CREATE POLICY "Users can manage task assignments"
  ON public.task_assignments FOR ALL
  USING (
    assigned_by = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'manager')
  );

-- Task comments policies
CREATE POLICY "Users can view comments on their tasks"
  ON public.task_comments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE created_by = auth.uid()
        OR assigned_to IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
        OR has_role(auth.uid(), 'admin')
        OR has_role(auth.uid(), 'manager')
    )
  );

CREATE POLICY "Users can add comments"
  ON public.task_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.task_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Chat channels policies
CREATE POLICY "Users can view channels they are members of"
  ON public.chat_channels FOR SELECT
  USING (
    id IN (SELECT channel_id FROM public.chat_channel_members WHERE user_id = auth.uid()) OR
    NOT is_private OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create channels"
  ON public.chat_channels FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Channel admins can update channels"
  ON public.chat_channels FOR UPDATE
  USING (
    created_by = auth.uid() OR
    id IN (SELECT channel_id FROM public.chat_channel_members WHERE user_id = auth.uid() AND role = 'admin') OR
    has_role(auth.uid(), 'admin')
  );

-- Chat channel members policies
CREATE POLICY "Users can view members of their channels"
  ON public.chat_channel_members FOR SELECT
  USING (
    channel_id IN (SELECT channel_id FROM public.chat_channel_members WHERE user_id = auth.uid()) OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Channel admins can manage members"
  ON public.chat_channel_members FOR ALL
  USING (
    channel_id IN (
      SELECT channel_id FROM public.chat_channel_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) OR
    has_role(auth.uid(), 'admin')
  );

-- Chat messages policies
CREATE POLICY "Users can view messages in their channels"
  ON public.chat_messages FOR SELECT
  USING (
    channel_id IN (SELECT channel_id FROM public.chat_channel_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can send messages to their channels"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    channel_id IN (SELECT channel_id FROM public.chat_channel_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Activity log policies (read-only for admins)
CREATE POLICY "Admins can view activity log"
  ON public.activity_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create default departments
INSERT INTO public.departments (name, description, active) VALUES
  ('Vendas', 'Departamento de vendas e atendimento ao cliente', true),
  ('Produção', 'Departamento de produção e montagem', true),
  ('Entrega', 'Departamento de logística e entregas', true),
  ('Financeiro', 'Departamento financeiro', true),
  ('Assistência Técnica', 'Departamento de assistência técnica e pós-venda', true),
  ('Compras', 'Departamento de compras e suprimentos', true),
  ('Administração', 'Departamento administrativo', true)
ON CONFLICT DO NOTHING;

-- Create a general chat channel
INSERT INTO public.chat_channels (name, description, channel_type, created_by, is_private)
SELECT 
  'Geral',
  'Canal geral da empresa',
  'general',
  (SELECT id FROM auth.users LIMIT 1),
  false
WHERE EXISTS (SELECT 1 FROM auth.users)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.departments IS 'Departments/sectors for organizing employees and tasks';
COMMENT ON TABLE public.tasks IS 'Task management system for team collaboration';
COMMENT ON TABLE public.task_assignments IS 'Multiple assignees per task';
COMMENT ON TABLE public.task_comments IS 'Comments and discussions on tasks';
COMMENT ON TABLE public.chat_channels IS 'Chat channels for internal communication';
COMMENT ON TABLE public.chat_channel_members IS 'Members of each chat channel';
COMMENT ON TABLE public.chat_messages IS 'Messages in chat channels';
COMMENT ON TABLE public.notifications IS 'System notifications for users';
COMMENT ON TABLE public.activity_log IS 'Audit trail for all system actions';
