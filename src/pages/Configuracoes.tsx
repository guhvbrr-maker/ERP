import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SkuSettings {
  enabled: boolean;
  prefix: string;
  start_number: number;
  current_number: number;
}

const Configuracoes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [skuSettings, setSkuSettings] = useState<SkuSettings>({
    enabled: false,
    prefix: "",
    start_number: 1,
    current_number: 1,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "sku_auto_generate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("key", "sku_auto_generate")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings?.value) {
      const value = settings.value as any;
      setSkuSettings({
        enabled: value.enabled ?? false,
        prefix: value.prefix ?? "",
        start_number: value.start_number ?? 1,
        current_number: value.current_number ?? 1,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: SkuSettings) => {
      const { error } = await supabase
        .from("settings")
        .update({ value: newSettings as any })
        .eq("key", "sku_auto_generate");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações de SKU foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(skuSettings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SKU Automático</CardTitle>
          <CardDescription>
            Configure a geração automática de códigos SKU para novos produtos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="sku-enabled"
              checked={skuSettings.enabled}
              onCheckedChange={(checked) =>
                setSkuSettings({ ...skuSettings, enabled: checked })
              }
            />
            <Label htmlFor="sku-enabled">Ativar geração automática de SKU</Label>
          </div>

          {skuSettings.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sku-prefix">Prefixo do SKU</Label>
                <Input
                  id="sku-prefix"
                  placeholder="Ex: PROD"
                  value={skuSettings.prefix}
                  onChange={(e) =>
                    setSkuSettings({ ...skuSettings, prefix: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Prefixo que será adicionado antes do número sequencial
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-number">Começar numeração em</Label>
                <Input
                  id="start-number"
                  type="number"
                  min="1"
                  value={skuSettings.start_number}
                  onChange={(e) =>
                    setSkuSettings({
                      ...skuSettings,
                      start_number: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Número inicial para a sequência de SKUs
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-number">Número atual</Label>
                <Input
                  id="current-number"
                  type="number"
                  min="1"
                  value={skuSettings.current_number}
                  onChange={(e) =>
                    setSkuSettings({
                      ...skuSettings,
                      current_number: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Próximo número que será usado na geração do SKU
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Exemplo de SKU gerado:</p>
                <p className="text-lg font-mono">
                  {skuSettings.prefix}
                  {skuSettings.current_number.toString().padStart(6, "0")}
                </p>
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracoes;
