import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Package, Edit, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AssistanceCardProps {
  assistance: any;
  onEdit: (id: string) => void;
  isDragging?: boolean;
}

const PRIORITY_COLORS = {
  low: "bg-blue-500",
  normal: "bg-gray-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const PRIORITY_LABELS = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export function AssistanceCard({ assistance, onEdit, isDragging }: AssistanceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: assistance.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-semibold text-sm">{assistance.assistance_number}</p>
            <p className="text-xs text-muted-foreground">{assistance.customer_name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(assistance.id);
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <Package className="h-3 w-3 text-muted-foreground" />
          <span className="truncate">{assistance.product_name}</span>
        </div>

        {assistance.sales && (
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-xs">
              Venda: {assistance.sales.sale_number}
            </Badge>
          </div>
        )}

        {assistance.employees?.people && (
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">{assistance.employees.people.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span>
            {format(new Date(assistance.opened_date), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {assistance.warranty_status ? "Garantia" : "Sem Garantia"}
          </Badge>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[assistance.priority as keyof typeof PRIORITY_COLORS]}`} />
            <span className="text-xs text-muted-foreground">
              {PRIORITY_LABELS[assistance.priority as keyof typeof PRIORITY_LABELS]}
            </span>
          </div>
        </div>

        {assistance.defect_description && (
          <div className="flex items-start gap-2 text-xs bg-muted p-2 rounded">
            <AlertCircle className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="line-clamp-2">{assistance.defect_description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
