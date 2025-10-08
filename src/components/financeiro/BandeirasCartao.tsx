import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardBrandForm } from "./CardBrandForm";
import { CardFeesManager } from "./CardFeesManager";

export function BandeirasCartao() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [feesManagerOpen, setFeesManagerOpen] = useState(false);
  const [selectedBrandForFees, setSelectedBrandForFees] = useState<string | null>(null);

  const { data: brands, isLoading } = useQuery({
    queryKey: ["card-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_brands")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bandeiras de Cartão</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Bandeira
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {brands?.map((brand) => (
          <Card key={brand.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">{brand.name}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedBrandForFees(brand.id);
                    setFeesManagerOpen(true);
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedBrand(brand.id);
                    setIsFormOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Código: {brand.code}</p>
                <Badge variant={brand.active ? "default" : "secondary"}>
                  {brand.active ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBrand ? "Editar Bandeira" : "Nova Bandeira"}
            </DialogTitle>
          </DialogHeader>
          <CardBrandForm
            brandId={selectedBrand}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedBrand(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={feesManagerOpen} onOpenChange={setFeesManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Taxas por Parcelamento</DialogTitle>
          </DialogHeader>
          {selectedBrandForFees && (
            <CardFeesManager
              brandId={selectedBrandForFees}
              onClose={() => {
                setFeesManagerOpen(false);
                setSelectedBrandForFees(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
