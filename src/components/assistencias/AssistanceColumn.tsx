import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AssistanceCard } from "./AssistanceCard";
import { Badge } from "@/components/ui/badge";

interface AssistanceColumnProps {
  status: string;
  label: string;
  color: string;
  assistances: any[];
  onEdit: (id: string) => void;
}

export function AssistanceColumn({
  status,
  label,
  color,
  assistances,
  onEdit,
}: AssistanceColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="bg-card border rounded-lg p-4 min-h-[600px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-semibold">{label}</h3>
        </div>
        <Badge variant="secondary">{assistances.length}</Badge>
      </div>

      <SortableContext
        id={status}
        items={assistances.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="space-y-3">
          {assistances.map((assistance) => (
            <AssistanceCard
              key={assistance.id}
              assistance={assistance}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
