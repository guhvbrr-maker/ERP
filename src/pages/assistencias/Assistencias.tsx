import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AssistanceKanban } from "@/components/assistencias/AssistanceKanban";
import { AssistanceList } from "@/components/assistencias/AssistanceList";
import { AssistanceForm } from "@/components/assistencias/AssistanceForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Assistencias() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAssistance, setSelectedAssistance] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setSelectedAssistance(id);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setSelectedAssistance(null);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assistências Técnicas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie e acompanhe todas as assistências técnicas
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Assistência
          </Button>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")}>
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-6">
            <AssistanceKanban onEdit={handleEdit} />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <AssistanceList onEdit={handleEdit} />
          </TabsContent>
        </Tabs>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedAssistance ? "Editar Assistência" : "Nova Assistência"}
              </DialogTitle>
            </DialogHeader>
            <AssistanceForm
              assistanceId={selectedAssistance}
              onClose={handleClose}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
