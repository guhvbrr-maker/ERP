import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, ListTodo, KanbanSquare } from "lucide-react";
import { TaskKanban } from "@/components/tarefas/TaskKanban";
import { TaskList } from "@/components/tarefas/TaskList";
import { TaskDialog } from "@/components/tarefas/TaskDialog";
import { TaskFilters } from "@/components/tarefas/TaskFilters";

export default function Tarefas() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    department: "",
    assignedTo: "",
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          assigned_employee:employees!tasks_assigned_to_fkey(id, name),
          department:departments(id, name),
          created_by_user:users!tasks_created_by_fkey(email)
        `)
        .order("created_at", { ascending: false });

      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.priority) {
        query = query.eq("priority", filters.priority);
      }
      if (filters.department) {
        query = query.eq("department_id", filters.department);
      }
      if (filters.assignedTo) {
        query = query.eq("assigned_to", filters.assignedTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleCreateTask = () => {
    setSelectedTask(null);
    setOpenDialog(true);
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setOpenDialog(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Tarefas</h1>
          <p className="text-muted-foreground">
            Organize e acompanhe as tarefas da equipe
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            onClick={() => setViewMode("kanban")}
          >
            <KanbanSquare className="h-4 w-4 mr-2" />
            Kanban
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
          >
            <ListTodo className="h-4 w-4 mr-2" />
            Lista
          </Button>
          <Button onClick={handleCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <TaskFilters
        filters={filters}
        onFiltersChange={setFilters}
        departments={departments || []}
        employees={employees || []}
      />

      {isLoading ? (
        <div className="text-center py-12">Carregando tarefas...</div>
      ) : viewMode === "kanban" ? (
        <TaskKanban tasks={tasks || []} onEditTask={handleEditTask} />
      ) : (
        <TaskList tasks={tasks || []} onEditTask={handleEditTask} />
      )}

      <TaskDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        task={selectedTask}
        departments={departments || []}
        employees={employees || []}
      />
    </div>
  );
}
