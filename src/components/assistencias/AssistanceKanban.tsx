import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from "@dnd-kit/core";
import { useState } from "react";
import { AssistanceColumn } from "./AssistanceColumn";
import { AssistanceCard } from "./AssistanceCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AssistanceKanbanProps {
  onEdit: (id: string) => void;
}

const STATUS_COLUMNS = [
  { id: "pending", label: "Pendente", color: "bg-yellow-500" },
  { id: "in_progress", label: "Em Andamento", color: "bg-blue-500" },
  { id: "waiting_parts", label: "Aguardando Peças", color: "bg-orange-500" },
  { id: "completed", label: "Concluído", color: "bg-green-500" },
  { id: "cancelled", label: "Cancelado", color: "bg-gray-500" },
];

export function AssistanceKanban({ onEdit }: AssistanceKanbanProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: assistances, isLoading } = useQuery({
    queryKey: ["technical-assistances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technical_assistances")
        .select(`
          *,
          sales(sale_number, sale_date),
          employees(person_id, people(name))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "in_progress" | "waiting_parts" | "completed" | "cancelled" }) => {
      const { error } = await supabase
        .from("technical_assistances")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technical-assistances"] });
      toast({
        title: "Status atualizado",
        description: "A assistência foi movida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const assistanceId = active.id as string;
    const newStatus = over.id as "pending" | "in_progress" | "waiting_parts" | "completed" | "cancelled";

    const assistance = assistances?.find((a) => a.id === assistanceId);
    if (assistance && assistance.status !== newStatus) {
      updateStatusMutation.mutate({ id: assistanceId, status: newStatus });
    }
  };

  const activeAssistance = assistances?.find((a) => a.id === activeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {STATUS_COLUMNS.map((column) => (
          <AssistanceColumn
            key={column.id}
            status={column.id}
            label={column.label}
            color={column.color}
            assistances={assistances?.filter((a) => a.status === column.id) || []}
            onEdit={onEdit}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId && activeAssistance ? (
          <AssistanceCard assistance={activeAssistance} onEdit={onEdit} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
