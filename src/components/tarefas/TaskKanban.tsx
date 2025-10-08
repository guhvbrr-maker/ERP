import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TaskCard } from "./TaskCard";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";

interface TaskKanbanProps {
  tasks: any[];
  onEditTask: (task: any) => void;
}

const columns = [
  { id: "pending", label: "Pendente", color: "bg-gray-100" },
  { id: "in_progress", label: "Em Andamento", color: "bg-blue-100" },
  { id: "review", label: "Em Revisão", color: "bg-yellow-100" },
  { id: "blocked", label: "Bloqueado", color: "bg-red-100" },
  { id: "completed", label: "Concluído", color: "bg-green-100" },
];

export function TaskKanban({ tasks, onEditTask }: TaskKanbanProps) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Status da tarefa atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const taskId = active.id as string;
      const newStatus = over.id as string;
      
      updateStatusMutation.mutate({ taskId, status: newStatus });
    }
    
    setActiveId(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const activeTask = tasks.find((task) => task.id === activeId);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <div key={column.id} className="flex flex-col">
              <div className={`${column.color} p-3 rounded-t-lg`}>
                <h3 className="font-semibold">
                  {column.label} ({columnTasks.length})
                </h3>
              </div>
              <SortableContext
                id={column.id}
                items={columnTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="bg-gray-50 p-2 rounded-b-lg min-h-[400px] space-y-2">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEditTask}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} onEdit={onEditTask} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
