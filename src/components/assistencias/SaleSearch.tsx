import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

interface SaleSearchProps {
  onSelect: (sale: any, product?: any) => void;
  onClose: () => void;
}

export function SaleSearch({ onSelect, onClose }: SaleSearchProps) {
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const { data: sales, isLoading } = useQuery({
    queryKey: ["sales-search", search],
    queryFn: async () => {
      if (!search) return [];

      const { data, error } = await supabase
        .from("sales")
        .select("*, sale_items(id, product_id, product_name, product_sku, quantity)")
        .or(`sale_number.ilike.%${search}%,customer_name.ilike.%${search}%`)
        .order("sale_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2,
  });

  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Buscar Venda</h4>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Digite o número da venda ou nome do cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading && (
          <div className="text-center text-sm text-muted-foreground py-4">
            Buscando...
          </div>
        )}

        {!isLoading && search.length >= 2 && sales && sales.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            Nenhuma venda encontrada
          </div>
        )}

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {sales?.map((sale) => (
            <Card
              key={sale.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setSelectedSale(sale)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{sale.sale_number}</Badge>
                    <span className="text-sm font-medium">{sale.customer_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>

                {selectedSale?.id === sale.id && (
                  <>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Selecione um produto:
                      </p>
                      {sale.sale_items?.map((item: any) => (
                        <Button
                          key={item.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(sale, item);
                          }}
                        >
                          <Package className="mr-2 h-3 w-3" />
                          <span className="flex-1 text-left">{item.product_name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {item.product_sku}
                          </Badge>
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(sale);
                        }}
                      >
                        Continuar sem produto
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
